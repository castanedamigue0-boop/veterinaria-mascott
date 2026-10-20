import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.middleware.csrf import get_token
from django.db.models import Sum, Count, Q
from .models import (
    Mascota, Cita, ConsultaClinica, Receta, Vacunacion, ArchivoMedico,
    Producto, LoteProducto, Proveedor, ProductoProveedor,
    OrdenCompra, ItemOrdenCompra, DevolucionProveedor, Notificacion
)


def es_admin(user):
    return user.is_staff or user.is_superuser

def es_vet(user):
    return user.groups.filter(name='Veterinario').exists() or es_admin(user)


# ─────────────────────────────────────────
# PÁGINAS HTML
# ─────────────────────────────────────────

def inicio(request):
    return render(request, 'mascott/inicio.html')

def login_registro(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'mascott/login-registro.html')

def cerrar_sesion(request):
    logout(request)
    return redirect('inicio')

@login_required(login_url='/login/')
def dashboard(request):
    return render(request, 'mascott/panel-usuario.html', {'usuario': request.user})

@login_required(login_url='/login/')
@user_passes_test(es_admin, login_url='/')
def panel_admin(request):
    return render(request, 'mascott/panel-administrador.html')

def tienda(request):
    return render(request, 'mascott/tienda-productos.html')

def calendario(request):
    return render(request, 'mascott/calendario.html')


# ─────────────────────────────────────────
# API — Autenticación
# ─────────────────────────────────────────

def api_csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})

def api_sesion(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'autenticado': True,
            'nombre':  request.user.first_name or request.user.username,
            'email':   request.user.email,
            'esAdmin': es_admin(request.user),
            'esVet':   es_vet(request.user),
        })
    return JsonResponse({'autenticado': False})

@require_POST
def api_login(request):
    try:
        d = json.loads(request.body)
        email    = d.get('email', '').strip().lower()
        password = d.get('password', '')
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    if not email or not password:
        return JsonResponse({'ok': False, 'error': 'Correo y contraseña requeridos.'}, status=400)

    try:
        u = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'No existe cuenta con ese correo.'}, status=401)

    user = authenticate(request, username=u.username, password=password)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Contraseña incorrecta.'}, status=401)

    login(request, user)
    return JsonResponse({'ok': True, 'nombre': user.first_name or user.username, 'email': user.email, 'esAdmin': es_admin(user)})

@require_POST
def api_registro(request):
    try:
        d = json.loads(request.body)
        nombre   = d.get('nombre',   '').strip()
        apellido = d.get('apellido', '').strip()
        email    = d.get('email',    '').strip().lower()
        password = d.get('password', '')
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    if not nombre: return JsonResponse({'ok': False, 'error': 'Nombre requerido.'}, status=400)
    if not email or '@' not in email: return JsonResponse({'ok': False, 'error': 'Correo inválido.'}, status=400)
    if len(password) < 6: return JsonResponse({'ok': False, 'error': 'Mínimo 6 caracteres.'}, status=400)
    if User.objects.filter(email=email).exists(): return JsonResponse({'ok': False, 'error': 'Correo ya registrado.'}, status=409)

    username = email.split('@')[0]
    base, i = username, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'; i += 1

    user = User.objects.create_user(username=username, email=email, password=password, first_name=nombre, last_name=apellido)
    login(request, user)
    return JsonResponse({'ok': True, 'nombre': user.first_name, 'email': user.email}, status=201)

def api_logout(request):
    logout(request)
    return JsonResponse({'ok': True})


# ─────────────────────────────────────────
# API — Citas
# ─────────────────────────────────────────

@login_required(login_url='/login/')
def api_citas(request):
    citas = list(Cita.objects.filter(usuario=request.user).values('id','mascota','servicio','fecha','hora','estado','notas'))
    return JsonResponse({'citas': citas})

@login_required(login_url='/login/')
@require_POST
def api_crear_cita(request):
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    mascota  = d.get('mascota',  '').strip()
    servicio = d.get('servicio', '').strip()
    fecha    = d.get('fecha',    '')
    hora     = d.get('hora',     '')

    if not all([mascota, servicio, fecha, hora]):
        return JsonResponse({'ok': False, 'error': 'Faltan campos.'}, status=400)
    if Cita.objects.filter(fecha=fecha, hora=hora).exclude(estado='cancelada').exists():
        return JsonResponse({'ok': False, 'error': 'Horario ocupado.'}, status=409)

    cita = Cita.objects.create(usuario=request.user, mascota=mascota, servicio=servicio, fecha=fecha, hora=hora, notas=d.get('notas',''))
    return JsonResponse({'ok': True, 'id': cita.id}, status=201)

def api_horas_ocupadas(request):
    fecha    = request.GET.get('fecha', '')
    ocupadas = list(Cita.objects.filter(fecha=fecha).exclude(estado='cancelada').values_list('hora', flat=True)) if fecha else []
    return JsonResponse({'ocupadas': ocupadas})


# ─────────────────────────────────────────
# API — Mascotas
# ─────────────────────────────────────────

@login_required(login_url='/login/')
def api_mascotas(request):
    mascotas = list(Mascota.objects.filter(dueno=request.user).values('id','nombre','especie','raza','edad','peso'))
    return JsonResponse({'mascotas': mascotas})

@login_required(login_url='/login/')
@require_POST
def api_crear_mascota(request):
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    nombre  = d.get('nombre',  '').strip()
    especie = d.get('especie', '').strip()
    if not nombre or not especie:
        return JsonResponse({'ok': False, 'error': 'Nombre y especie requeridos.'}, status=400)

    m = Mascota.objects.create(dueno=request.user, nombre=nombre, especie=especie, raza=d.get('raza',''), edad=d.get('edad'), peso=d.get('peso'))
    return JsonResponse({'ok': True, 'id': m.id}, status=201)


# ─────────────────────────────────────────
# API — Historial Clínico (VM-76)
# Solo veterinarios y admins pueden crear/editar.
# Clientes solo pueden leer el historial de sus mascotas.
# ─────────────────────────────────────────

@login_required(login_url='/login/')
def api_historial(request, mascota_id):
    """Lista el historial clínico de una mascota."""
    mascota = get_object_or_404(Mascota, pk=mascota_id)
    # Cliente solo ve sus propias mascotas
    if not es_vet(request.user) and mascota.dueno != request.user:
        return JsonResponse({'ok': False, 'error': 'Sin permiso.'}, status=403)

    consultas = list(ConsultaClinica.objects.filter(mascota=mascota).values(
        'id','fecha','motivo','diagnostico','tratamiento','peso','temperatura'
    ))
    vacunas = list(Vacunacion.objects.filter(mascota=mascota).values(
        'id','vacuna','tipo','fecha','proxima_dosis','lote'
    ))
    return JsonResponse({'consultas': consultas, 'vacunas': vacunas})

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_vet, login_url='/')
def api_crear_consulta(request):
    """Crea una nueva consulta clínica. Solo veterinarios y admins."""
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    mascota_id = d.get('mascota_id')
    motivo     = d.get('motivo', '').strip()
    fecha      = d.get('fecha', '')

    if not all([mascota_id, motivo, fecha]):
        return JsonResponse({'ok': False, 'error': 'Faltan campos obligatorios.'}, status=400)

    mascota = get_object_or_404(Mascota, pk=mascota_id)
    consulta = ConsultaClinica.objects.create(
        mascota      = mascota,
        veterinario  = request.user,
        fecha        = fecha,
        motivo       = motivo,
        diagnostico  = d.get('diagnostico', ''),
        tratamiento  = d.get('tratamiento', ''),
        examenes     = d.get('examenes', ''),
        peso         = d.get('peso'),
        temperatura  = d.get('temperatura'),
        frecuencia_cardiaca = d.get('frecuencia_cardiaca'),
    )
    return JsonResponse({'ok': True, 'id': consulta.id}, status=201)

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_vet, login_url='/')
def api_crear_vacunacion(request):
    """Registra una vacuna o desparasitación. Solo veterinarios."""
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    mascota = get_object_or_404(Mascota, pk=d.get('mascota_id'))
    v = Vacunacion.objects.create(
        mascota       = mascota,
        veterinario   = request.user,
        vacuna        = d.get('vacuna', ''),
        tipo          = d.get('tipo', 'vacuna'),
        lote          = d.get('lote', ''),
        fecha         = d.get('fecha'),
        proxima_dosis = d.get('proxima_dosis') or None,
    )
    return JsonResponse({'ok': True, 'id': v.id}, status=201)


# ─────────────────────────────────────────
# API — Productos
# ─────────────────────────────────────────

def api_productos(request):
    productos = list(Producto.objects.filter(activo=True).values('id','nombre','descripcion','precio','categoria','stock','imagen_url'))
    return JsonResponse({'productos': productos})

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_admin, login_url='/')
def api_crear_producto(request):
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    nombre = d.get('nombre', '').strip()
    if not nombre:
        return JsonResponse({'ok': False, 'error': 'Nombre requerido.'}, status=400)

    p = Producto.objects.create(
        nombre       = nombre,
        descripcion  = d.get('descripcion', ''),
        precio       = d.get('precio', 0),
        costo        = d.get('costo', 0),
        categoria    = d.get('categoria', 'otro'),
        stock        = d.get('stock', 0),
        stock_minimo = d.get('stock_minimo', 5),
    )
    return JsonResponse({'ok': True, 'id': p.id}, status=201)


# ─────────────────────────────────────────
# API — Proveedores (VM-77)
# ─────────────────────────────────────────

@login_required(login_url='/login/')
@user_passes_test(es_admin, login_url='/')
def api_proveedores(request):
    q       = request.GET.get('q', '')
    activo  = request.GET.get('activo', '')
    provs   = Proveedor.objects.all()
    if q:      provs = provs.filter(Q(razon_social__icontains=q) | Q(nit__icontains=q))
    if activo: provs = provs.filter(activo=(activo == '1'))
    data = list(provs.values('id','razon_social','nit','contacto','telefono','correo','activo','dias_credito'))
    return JsonResponse({'proveedores': data})

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_admin, login_url='/')
def api_crear_proveedor(request):
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    nit          = d.get('nit', '').strip()
    razon_social = d.get('razon_social', '').strip()
    correo       = d.get('correo', '').strip()

    if not nit or not razon_social:
        return JsonResponse({'ok': False, 'error': 'NIT y razón social requeridos.'}, status=400)
    if Proveedor.objects.filter(nit=nit).exists():
        return JsonResponse({'ok': False, 'error': 'NIT ya registrado.'}, status=409)
    if correo and Proveedor.objects.filter(correo=correo).exists():
        return JsonResponse({'ok': False, 'error': 'Correo ya registrado.'}, status=409)

    p = Proveedor.objects.create(
        nit          = nit,
        razon_social = razon_social,
        contacto     = d.get('contacto', ''),
        telefono     = d.get('telefono', ''),
        correo       = correo,
        direccion    = d.get('direccion', ''),
        dias_credito = d.get('dias_credito', 0),
        dias_entrega = d.get('dias_entrega', 1),
    )
    return JsonResponse({'ok': True, 'id': p.id}, status=201)

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_admin, login_url='/')
def api_toggle_proveedor(request, proveedor_id):
    """Activa o desactiva un proveedor sin eliminarlo."""
    p = get_object_or_404(Proveedor, pk=proveedor_id)
    p.activo = not p.activo
    p.save()
    return JsonResponse({'ok': True, 'activo': p.activo})


# ─────────────────────────────────────────
# API — Órdenes de Compra (VM-78)
# ─────────────────────────────────────────

@login_required(login_url='/login/')
@user_passes_test(es_admin, login_url='/')
def api_ordenes(request):
    q      = request.GET.get('q', '')
    estado = request.GET.get('estado', '')
    ords   = OrdenCompra.objects.all()
    if q:      ords = ords.filter(Q(proveedor__razon_social__icontains=q) | Q(pk__icontains=q))
    if estado: ords = ords.filter(estado=estado)
    data = list(ords.values('id','proveedor__razon_social','fecha','total','estado','creado'))
    return JsonResponse({'ordenes': data})

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_admin, login_url='/')
def api_crear_orden(request):
    """Crea una orden de compra con sus ítems."""
    try:
        d = json.loads(request.body)
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    proveedor_id = d.get('proveedor_id')
    fecha        = d.get('fecha', '')
    items        = d.get('items', [])

    if not proveedor_id or not fecha or not items:
        return JsonResponse({'ok': False, 'error': 'Proveedor, fecha e ítems requeridos.'}, status=400)

    proveedor = get_object_or_404(Proveedor, pk=proveedor_id)
    orden = OrdenCompra.objects.create(
        proveedor        = proveedor,
        fecha            = fecha,
        entrega_estimada = d.get('entrega_estimada') or None,
        forma_pago       = d.get('forma_pago', ''),
        creado_por       = request.user,
    )

    subtotal = 0
    for item in items:
        prod = get_object_or_404(Producto, pk=item['producto_id'])
        qty  = int(item['cantidad'])
        cost = float(item['costo_unitario'])
        ItemOrdenCompra.objects.create(orden=orden, producto=prod, cantidad=qty, costo_unitario=cost, subtotal=qty*cost)
        subtotal += qty * cost

    iva           = subtotal * 0.19
    orden.subtotal = subtotal
    orden.iva      = iva
    orden.total    = subtotal + iva
    orden.save()
    return JsonResponse({'ok': True, 'id': orden.id, 'total': float(orden.total)}, status=201)

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_admin, login_url='/')
def api_recibir_orden(request, orden_id):
    """Marca la orden como recibida y actualiza el stock."""
    orden = get_object_or_404(OrdenCompra, pk=orden_id)
    if orden.estado not in ['pendiente']:
        return JsonResponse({'ok': False, 'error': 'Solo se pueden recibir órdenes pendientes.'}, status=400)

    parcial = json.loads(request.body).get('parcial', False)
    for item in orden.items.all():
        item.producto.stock += item.cantidad
        item.producto.save()

    orden.estado = 'recibida_parcial' if parcial else 'recibida'
    orden.save()
    return JsonResponse({'ok': True})

@login_required(login_url='/login/')
@require_POST
@user_passes_test(es_admin, login_url='/')
def api_anular_orden(request, orden_id):
    """Anula una orden pendiente."""
    orden = get_object_or_404(OrdenCompra, pk=orden_id)
    if orden.estado != 'pendiente':
        return JsonResponse({'ok': False, 'error': 'Solo se pueden anular órdenes pendientes.'}, status=400)

    try:
        d = json.loads(request.body)
        motivo = d.get('motivo', '').strip()
    except Exception:
        motivo = ''

    if not motivo:
        return JsonResponse({'ok': False, 'error': 'El motivo de anulación es requerido.'}, status=400)

    orden.estado           = 'anulada'
    orden.motivo_anulacion = motivo
    orden.save()
    return JsonResponse({'ok': True})


# ─────────────────────────────────────────
# API — Dashboard estadísticas
# ─────────────────────────────────────────

@login_required(login_url='/login/')
@user_passes_test(es_admin, login_url='/')
def api_stats(request):
    """Estadísticas generales para el panel administrador."""
    return JsonResponse({
        'total_citas':       Cita.objects.count(),
        'citas_pendientes':  Cita.objects.filter(estado='pendiente').count(),
        'total_clientes':    User.objects.filter(is_staff=False).count(),
        'total_productos':   Producto.objects.filter(activo=True).count(),
        'stock_bajo':        Producto.objects.filter(activo=True, stock__lte=5).count(),
        'total_proveedores': Proveedor.objects.filter(activo=True).count(),
        'ordenes_pendientes':OrdenCompra.objects.filter(estado='pendiente').count(),
        'ingresos':          float(OrdenCompra.objects.filter(estado='recibida').aggregate(t=Sum('total'))['t'] or 0),
    })
