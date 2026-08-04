from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone
from decimal import Decimal
import json

from .models import Mascota, Cita, Producto, Pedido, ItemPedido, Notificacion


# ─── HELPERS ────────────────────────────────────────────────────────────────
def es_admin(user):
    return user.is_staff or user.is_superuser


# ─── INICIO (landing page) ───────────────────────────────────────────────────
def inicio(request):
    productos_destacados = Producto.objects.filter(activo=True, badge='oferta')[:6]
    return render(request, 'mascott/inicio.html', {
        'productos_destacados': productos_destacados,
    })


# ─── LOGIN / REGISTRO ─────────────────────────────────────────────────────────
def login_registro(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        accion = request.POST.get('accion')

        # ── LOGIN ──
        if accion == 'login':
            email    = request.POST.get('email', '').strip().lower()
            password = request.POST.get('password', '')
            try:
                user_obj = User.objects.get(email=email)
                user     = authenticate(request, username=user_obj.username, password=password)
                if user:
                    login(request, user)
                    return redirect('dashboard')
                else:
                    messages.error(request, '❌ Correo o contraseña incorrectos.')
            except User.DoesNotExist:
                messages.error(request, '❌ No existe una cuenta con ese correo.')

        # ── REGISTRO ──
        elif accion == 'registro':
            nombre   = request.POST.get('nombre', '').strip()
            apellido = request.POST.get('apellido', '').strip()
            email    = request.POST.get('email', '').strip().lower()
            password = request.POST.get('password', '')
            tel      = request.POST.get('tel', '').strip()

            if User.objects.filter(email=email).exists():
                messages.error(request, '❌ Ya existe una cuenta con ese correo.')
            elif len(password) < 6:
                messages.error(request, '❌ La contraseña debe tener mínimo 6 caracteres.')
            else:
                username = email.split('@')[0]
                # evitar usernames duplicados
                base, i = username, 1
                while User.objects.filter(username=username).exists():
                    username = f'{base}{i}'; i += 1

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=nombre,
                    last_name=apellido,
                )
                user.profile_tel = tel  # se guarda en sesión, no en modelo extendido
                user.save()
                login(request, user)
                messages.success(request, f'✅ ¡Bienvenido/a {nombre}!')
                return redirect('dashboard')

    return render(request, 'mascott/login-registro.html')


def cerrar_sesion(request):
    logout(request)
    return redirect('inicio')


# ─── DASHBOARD (panel usuario) ────────────────────────────────────────────────
@login_required
def dashboard(request):
    user     = request.user
    mascotas = Mascota.objects.filter(dueno=user)
    citas    = Cita.objects.filter(usuario=user).order_by('-fecha')
    pedidos  = Pedido.objects.filter(usuario=user).order_by('-fecha')
    notifs   = Notificacion.objects.filter(usuario=user, leida=False)

    # marcar notificaciones como leídas al entrar
    notifs.update(leida=True)

    todas_notifs = Notificacion.objects.filter(usuario=user).order_by('-creado')[:20]

    return render(request, 'mascott/panel-usuario.html', {
        'mascotas':      mascotas,
        'citas':         citas,
        'pedidos':       pedidos,
        'notificaciones': todas_notifs,
        'pendientes':    citas.filter(estado='pendiente').count(),
        'completadas':   citas.filter(estado='completada').count(),
    })


# ─── CITAS ────────────────────────────────────────────────────────────────────
@login_required
@require_POST
def crear_cita(request):
    mascota  = request.POST.get('mascota', '').strip()
    servicio = request.POST.get('servicio', '')
    fecha    = request.POST.get('fecha', '')
    hora     = request.POST.get('hora', '')
    notas    = request.POST.get('notas', '').strip()

    if not all([mascota, servicio, fecha, hora]):
        messages.error(request, '❌ Completa todos los campos obligatorios.')
        return redirect('dashboard')

    # Verificar que la hora no esté ocupada ese día
    if Cita.objects.filter(fecha=fecha, hora=hora).exclude(estado='cancelada').exists():
        messages.error(request, '❌ Ese horario ya está ocupado. Elige otro.')
        return redirect('dashboard')

    Cita.objects.create(
        usuario=request.user,
        mascota=mascota,
        servicio=servicio,
        fecha=fecha,
        hora=hora,
        notas=notas,
    )
    messages.success(request, '✅ Cita agendada correctamente.')
    return redirect('dashboard')


@login_required
@require_POST
def cancelar_cita(request, cita_id):
    cita = get_object_or_404(Cita, pk=cita_id, usuario=request.user)
    cita.estado = 'cancelada'
    cita.save()
    messages.success(request, '✅ Cita cancelada.')
    return redirect('dashboard')


# ─── MASCOTAS ─────────────────────────────────────────────────────────────────
@login_required
@require_POST
def crear_mascota(request):
    nombre  = request.POST.get('nombre', '').strip()
    especie = request.POST.get('especie', '')
    raza    = request.POST.get('raza', '').strip()
    edad    = request.POST.get('edad', None)

    if not nombre or not especie:
        messages.error(request, '❌ Nombre y especie son obligatorios.')
        return redirect('dashboard')

    Mascota.objects.create(
        dueno=request.user,
        nombre=nombre,
        especie=especie,
        raza=raza,
        edad=edad if edad else None,
    )
    messages.success(request, f'✅ Mascota {nombre} registrada.')
    return redirect('dashboard')


@login_required
@require_POST
def eliminar_mascota(request, mascota_id):
    mascota = get_object_or_404(Mascota, pk=mascota_id, dueno=request.user)
    nombre  = mascota.nombre
    mascota.delete()
    messages.success(request, f'🗑 {nombre} eliminada.')
    return redirect('dashboard')


# ─── TIENDA ───────────────────────────────────────────────────────────────────
def tienda(request):
    productos = Producto.objects.filter(activo=True)

    # filtros GET
    animal    = request.GET.get('animal', 'todos')
    categoria = request.GET.get('cat',    'todos')
    etapa     = request.GET.get('etapa',  'todos')
    busqueda  = request.GET.get('q',      '')

    if animal    != 'todos': productos = productos.filter(animal=animal)
    if categoria != 'todos': productos = productos.filter(categoria=categoria)
    if etapa     != 'todos': productos = productos.filter(etapa=etapa)
    if busqueda:             productos = productos.filter(nombre__icontains=busqueda)

    carrito     = request.session.get('carrito', {})
    carrito_json = json.dumps(carrito)

    animales   = [('todos','Todos')] + list(Producto.ANIMALES)
    categorias = [('todos','Todos')] + list(Producto.CATEGORIAS)

    return render(request, 'mascott/tienda-productos.html', {
        'productos':    productos,
        'animal':       animal,
        'categoria':    categoria,
        'etapa':        etapa,
        'busqueda':     busqueda,
        'carrito_json': carrito_json,
        'animales':     animales,
        'categorias':   categorias,
    })


# ─── CARRITO (sesión) ─────────────────────────────────────────────────────────
@require_POST
def agregar_carrito(request, producto_id):
    producto = get_object_or_404(Producto, pk=producto_id, activo=True)
    carrito  = request.session.get('carrito', {})
    pid      = str(producto_id)

    if pid in carrito:
        carrito[pid]['qty'] += 1
    else:
        carrito[pid] = {
            'nombre': producto.nombre,
            'precio': str(producto.precio),
            'marca':  producto.marca,
            'emoji':  producto.emoji,
            'qty':    1,
        }
    request.session['carrito'] = carrito
    request.session.modified   = True

    total_items = sum(i['qty'] for i in carrito.values())
    return JsonResponse({'ok': True, 'total': total_items, 'mensaje': f'🛒 {producto.nombre} agregado'})


def ver_carrito(request):
    carrito  = request.session.get('carrito', {})
    items    = []
    total    = Decimal('0')
    for pid, item in carrito.items():
        subtotal = Decimal(item['precio']) * item['qty']
        items.append({**item, 'id': pid, 'subtotal': subtotal})
        total += subtotal
    return render(request, 'mascott/carrito.html', {'items': items, 'total': total})


@require_POST
def actualizar_carrito(request, producto_id):
    carrito = request.session.get('carrito', {})
    pid     = str(producto_id)
    accion  = request.POST.get('accion')

    if pid in carrito:
        if accion == 'mas':
            carrito[pid]['qty'] += 1
        elif accion == 'menos':
            carrito[pid]['qty'] -= 1
            if carrito[pid]['qty'] <= 0:
                del carrito[pid]
        elif accion == 'quitar':
            del carrito[pid]

    request.session['carrito'] = carrito
    request.session.modified   = True
    return redirect('ver_carrito')


@login_required
@require_POST
def confirmar_pedido(request):
    carrito = request.session.get('carrito', {})
    if not carrito:
        messages.error(request, '⚠️ Tu carrito está vacío.')
        return redirect('tienda')

    total  = sum(Decimal(i['precio']) * i['qty'] for i in carrito.values())
    pedido = Pedido.objects.create(usuario=request.user, total=total)

    for pid, item in carrito.items():
        try:
            producto = Producto.objects.get(pk=int(pid))
        except Producto.DoesNotExist:
            producto = None
        ItemPedido.objects.create(
            pedido=pedido,
            producto=producto,
            nombre=item['nombre'],
            precio=Decimal(item['precio']),
            cantidad=item['qty'],
        )
        # descontar stock
        if producto and producto.cantidad >= item['qty']:
            producto.cantidad -= item['qty']
            producto.save()

    # vaciar carrito
    request.session['carrito'] = {}
    request.session.modified   = True

    messages.success(request, f'🎉 Pedido #{pedido.pk} confirmado. ¡Gracias!')
    return redirect('dashboard')


# ─── PERFIL ───────────────────────────────────────────────────────────────────
@login_required
@require_POST
def actualizar_perfil(request):
    user           = request.user
    user.first_name = request.POST.get('nombre',   '').strip()
    user.last_name  = request.POST.get('apellido', '').strip()
    user.email      = request.POST.get('email',    '').strip().lower()
    nueva_pass      = request.POST.get('password', '')
    if nueva_pass and len(nueva_pass) >= 6:
        user.set_password(nueva_pass)
        messages.info(request, 'Contraseña actualizada. Vuelve a iniciar sesión.')
    user.save()
    messages.success(request, '✅ Perfil actualizado.')
    return redirect('dashboard')


# ─── HORAS DISPONIBLES (AJAX) ─────────────────────────────────────────────────
def horas_ocupadas(request):
    fecha = request.GET.get('fecha', '')
    if not fecha:
        return JsonResponse({'ocupadas': []})
    ocupadas = list(
        Cita.objects.filter(fecha=fecha)
        .exclude(estado='cancelada')
        .values_list('hora', flat=True)
    )
    return JsonResponse({'ocupadas': ocupadas})


# ─── PANEL ADMINISTRADOR ─────────────────────────────────────────────────────
@login_required
@user_passes_test(es_admin)
def panel_administrador(request):
    from django.db.models import Sum, Count

    citas    = Cita.objects.all().order_by('-fecha')
    usuarios = User.objects.filter(is_staff=False).order_by('-date_joined')
    productos = Producto.objects.all()
    pedidos  = Pedido.objects.all().order_by('-fecha')

    stats = {
        'total_citas':     citas.count(),
        'pendientes':      citas.filter(estado='pendiente').count(),
        'confirmadas':     citas.filter(estado='confirmada').count(),
        'total_clientes':  usuarios.count(),
        'total_productos': productos.count(),
        'stock_bajo':      productos.filter(cantidad__lte=5).count(),
        'total_pedidos':   pedidos.count(),
        'ingresos':        pedidos.aggregate(total=Sum('total'))['total'] or 0,
    }

    return render(request, 'mascott/panel-administrador.html', {
        'citas':    citas,
        'usuarios': usuarios,
        'productos': productos,
        'pedidos':  pedidos,
        'stats':    stats,
    })


@login_required
@user_passes_test(es_admin)
@require_POST
def cambiar_estado_cita(request, cita_id):
    cita        = get_object_or_404(Cita, pk=cita_id)
    nuevo_estado = request.POST.get('estado')
    if nuevo_estado in ['confirmada', 'cancelada', 'completada']:
        cita.estado = nuevo_estado
        cita.save()
        # notificar al usuario
        emojis = {'confirmada': '✅', 'cancelada': '❌', 'completada': '🎉'}
        msg = (f'{emojis.get(nuevo_estado, "")} Tu cita de {cita.servicio} para '
               f'{cita.mascota} el {cita.fecha} a las {cita.hora} '
               f'fue {nuevo_estado} por el veterinario.')
        Notificacion.objects.create(usuario=cita.usuario, mensaje=msg)
        messages.success(request, f'✅ Cita {nuevo_estado}. Notificación enviada.')
    return redirect('panel_administrador')


@login_required
@user_passes_test(es_admin)
@require_POST
def agregar_producto_admin(request):
    nombre   = request.POST.get('nombre', '').strip()
    precio   = request.POST.get('precio', '0')
    cantidad = request.POST.get('cantidad', '0')
    if not nombre:
        messages.error(request, '❌ El nombre es obligatorio.')
        return redirect('panel_administrador')

    Producto.objects.create(
        nombre      = nombre,
        marca       = request.POST.get('marca', '').strip(),
        descripcion = request.POST.get('desc', '').strip(),
        precio      = Decimal(precio),
        animal      = request.POST.get('animal', 'todos'),
        categoria   = request.POST.get('categoria', 'accesorio'),
        etapa       = request.POST.get('etapa', 'adulto'),
        badge       = request.POST.get('badge', ''),
        cantidad    = int(cantidad),
    )
    messages.success(request, '✅ Producto agregado.')
    return redirect('panel_administrador')


@login_required
@user_passes_test(es_admin)
@require_POST
def eliminar_producto_admin(request, producto_id):
    producto = get_object_or_404(Producto, pk=producto_id)
    producto.delete()
    messages.success(request, '🗑 Producto eliminado.')
    return redirect('panel_administrador')
