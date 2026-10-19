import json
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.middleware.csrf import get_token
from .models import Mascota, Cita, Producto, Notificacion


def es_admin(user):
    return user.is_staff or user.is_superuser


# ─────────────────────────────────────────
# PÁGINAS — Solo renderizan el template HTML
# El código Python corre en el servidor,
# el usuario solo ve el HTML resultante.
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
# API REST — Responden JSON
# Toda la lógica y validación corre aquí,
# en el servidor. El usuario NO puede verla.
# ─────────────────────────────────────────

def api_csrf(request):
    """Entrega el token CSRF al frontend de forma segura."""
    return JsonResponse({'csrfToken': get_token(request)})

def api_sesion(request):
    """Informa si hay sesión activa. No expone contraseñas."""
    if request.user.is_authenticated:
        return JsonResponse({
            'autenticado': True,
            'nombre':  request.user.first_name or request.user.username,
            'email':   request.user.email,
            'esAdmin': es_admin(request.user),
        })
    return JsonResponse({'autenticado': False})

@require_POST
def api_login(request):
    """
    Autentica al usuario. La contraseña nunca sale del servidor.
    El frontend solo recibe si fue exitoso o no.
    """
    try:
        datos    = json.loads(request.body)
        email    = datos.get('email', '').strip().lower()
        password = datos.get('password', '')
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    if not email or not password:
        return JsonResponse({'ok': False, 'error': 'Correo y contraseña son obligatorios.'}, status=400)

    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'No existe una cuenta con ese correo.'}, status=401)

    user = authenticate(request, username=user_obj.username, password=password)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Contraseña incorrecta.'}, status=401)

    login(request, user)
    return JsonResponse({
        'ok':     True,
        'nombre': user.first_name or user.username,
        'email':  user.email,
        'esAdmin': es_admin(user),
    })

@require_POST
def api_registro(request):
    """
    Crea un usuario nuevo. La contraseña se hashea
    automáticamente — nunca se guarda en texto plano.
    """
    try:
        datos    = json.loads(request.body)
        nombre   = datos.get('nombre',   '').strip()
        apellido = datos.get('apellido', '').strip()
        email    = datos.get('email',    '').strip().lower()
        password = datos.get('password', '')
    except Exception:
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    if not nombre:
        return JsonResponse({'ok': False, 'error': 'El nombre es obligatorio.'}, status=400)
    if not email or '@' not in email:
        return JsonResponse({'ok': False, 'error': 'El correo no es válido.'}, status=400)
    if len(password) < 6:
        return JsonResponse({'ok': False, 'error': 'Mínimo 6 caracteres.'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'ok': False, 'error': 'Ya existe una cuenta con ese correo.'}, status=409)

    username = email.split('@')[0]
    base, i  = username, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'; i += 1

    user = User.objects.create_user(
        username=username, email=email,
        password=password, first_name=nombre, last_name=apellido,
    )
    login(request, user)
    return JsonResponse({'ok': True, 'nombre': user.first_name, 'email': user.email}, status=201)

def api_logout(request):
    logout(request)
    return JsonResponse({'ok': True})


# ── Citas ──

@login_required(login_url='/login/')
def api_citas(request):
    citas = list(Cita.objects.filter(usuario=request.user).values(
        'id', 'mascota', 'servicio', 'fecha', 'hora', 'estado', 'notas'
    ))
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
    notas    = d.get('notas',    '').strip()

    if not all([mascota, servicio, fecha, hora]):
        return JsonResponse({'ok': False, 'error': 'Faltan campos obligatorios.'}, status=400)

    if Cita.objects.filter(fecha=fecha, hora=hora).exclude(estado='cancelada').exists():
        return JsonResponse({'ok': False, 'error': 'Ese horario ya está ocupado.'}, status=409)

    cita = Cita.objects.create(
        usuario=request.user, mascota=mascota,
        servicio=servicio, fecha=fecha, hora=hora, notas=notas,
    )
    return JsonResponse({'ok': True, 'id': cita.id}, status=201)

def api_horas_ocupadas(request):
    fecha    = request.GET.get('fecha', '')
    ocupadas = list(Cita.objects.filter(fecha=fecha).exclude(estado='cancelada').values_list('hora', flat=True)) if fecha else []
    return JsonResponse({'ocupadas': ocupadas})


# ── Mascotas ──

@login_required(login_url='/login/')
def api_mascotas(request):
    mascotas = list(Mascota.objects.filter(dueno=request.user).values('id','nombre','especie','raza','edad'))
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
        return JsonResponse({'ok': False, 'error': 'Nombre y especie son obligatorios.'}, status=400)

    m = Mascota.objects.create(dueno=request.user, nombre=nombre, especie=especie, raza=d.get('raza',''), edad=d.get('edad'))
    return JsonResponse({'ok': True, 'id': m.id}, status=201)


# ── Productos ──

def api_productos(request):
    productos = list(Producto.objects.filter(activo=True).values('id','nombre','descripcion','precio','categoria','imagen_url'))
    return JsonResponse({'productos': productos})
