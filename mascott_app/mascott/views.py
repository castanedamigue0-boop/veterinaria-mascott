import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from .models import Mascota, Cita, Producto, Notificacion


# ─────────────────────────────────────────
# PÁGINAS HTML
# ─────────────────────────────────────────

def inicio(request):
    """Página principal del sitio."""
    return render(request, 'mascott/inicio.html')


def login_registro(request):
    """Página de login y registro."""
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'mascott/login-registro.html')


def cerrar_sesion(request):
    """Cierra la sesión del usuario."""
    logout(request)
    return redirect('inicio')


@login_required
def dashboard(request):
    """Panel del usuario autenticado."""
    return render(request, 'mascott/panel-usuario.html')


# ─────────────────────────────────────────
# API REST — Autenticación
# Todas las respuestas son JSON.
# El frontend llama a estos endpoints con fetch().
# ─────────────────────────────────────────

def api_csrf(request):
    """Devuelve el token CSRF para que el frontend lo use en sus peticiones."""
    return JsonResponse({'csrfToken': get_token(request)})


@require_POST
def api_login(request):
    """
    Inicia sesión con email y contraseña.
    POST body: { "email": "...", "password": "..." }
    """
    try:
        datos    = json.loads(request.body)
        email    = datos.get('email', '').strip().lower()
        password = datos.get('password', '')
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

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
        'esAdmin': user.is_staff or user.is_superuser,
    })


@require_POST
def api_registro(request):
    """
    Registra un nuevo usuario.
    POST body: { "nombre": "...", "apellido": "...", "email": "...", "password": "...", "telefono": "..." }
    """
    try:
        datos    = json.loads(request.body)
        nombre   = datos.get('nombre',   '').strip()
        apellido = datos.get('apellido', '').strip()
        email    = datos.get('email',    '').strip().lower()
        password = datos.get('password', '')
        telefono = datos.get('telefono', '').strip()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    # Validaciones
    if not nombre:
        return JsonResponse({'ok': False, 'error': 'El nombre es obligatorio.'}, status=400)
    if not email or '@' not in email:
        return JsonResponse({'ok': False, 'error': 'El correo no es válido.'}, status=400)
    if len(password) < 6:
        return JsonResponse({'ok': False, 'error': 'La contraseña debe tener mínimo 6 caracteres.'}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({'ok': False, 'error': 'Ya existe una cuenta con ese correo.'}, status=409)

    # Crear usuario — username único derivado del email
    username = email.split('@')[0]
    base, i  = username, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{i}'; i += 1

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=nombre,
        last_name=apellido,
    )
    # Guardar teléfono en el perfil si se envió
    if telefono:
        user.profile_telefono = telefono
        user.save()

    login(request, user)
    return JsonResponse({
        'ok':     True,
        'nombre': user.first_name,
        'email':  user.email,
    }, status=201)


def api_logout(request):
    """Cierra la sesión desde el frontend."""
    logout(request)
    return JsonResponse({'ok': True})


def api_sesion(request):
    """
    Devuelve si el usuario está autenticado.
    El frontend llama esto al cargar la página.
    """
    if request.user.is_authenticated:
        return JsonResponse({
            'autenticado': True,
            'nombre':  request.user.first_name or request.user.username,
            'email':   request.user.email,
            'esAdmin': request.user.is_staff or request.user.is_superuser,
        })
    return JsonResponse({'autenticado': False})


# ─────────────────────────────────────────
# API REST — Citas
# ─────────────────────────────────────────

@login_required
def api_citas(request):
    """Lista las citas del usuario autenticado."""
    citas = Cita.objects.filter(usuario=request.user).values(
        'id', 'mascota', 'servicio', 'fecha', 'hora', 'estado', 'notas'
    )
    return JsonResponse({'citas': list(citas)})


@login_required
@require_POST
def api_crear_cita(request):
    """
    Crea una nueva cita.
    POST body: { "mascota": "...", "servicio": "...", "fecha": "YYYY-MM-DD", "hora": "HH:MM", "notas": "..." }
    """
    try:
        datos    = json.loads(request.body)
        mascota  = datos.get('mascota',  '').strip()
        servicio = datos.get('servicio', '').strip()
        fecha    = datos.get('fecha',    '')
        hora     = datos.get('hora',     '')
        notas    = datos.get('notas',    '').strip()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    if not all([mascota, servicio, fecha, hora]):
        return JsonResponse({'ok': False, 'error': 'Faltan campos obligatorios.'}, status=400)

    # Verificar que ese horario no esté ya ocupado
    if Cita.objects.filter(fecha=fecha, hora=hora).exclude(estado='cancelada').exists():
        return JsonResponse({'ok': False, 'error': 'Ese horario ya está ocupado.'}, status=409)

    cita = Cita.objects.create(
        usuario=request.user,
        mascota=mascota,
        servicio=servicio,
        fecha=fecha,
        hora=hora,
        notas=notas,
    )
    return JsonResponse({'ok': True, 'id': cita.id}, status=201)


@login_required
def api_horas_ocupadas(request):
    """Devuelve las horas ya ocupadas para una fecha dada."""
    fecha = request.GET.get('fecha', '')
    if not fecha:
        return JsonResponse({'ocupadas': []})
    ocupadas = list(
        Cita.objects.filter(fecha=fecha)
        .exclude(estado='cancelada')
        .values_list('hora', flat=True)
    )
    return JsonResponse({'ocupadas': ocupadas})


# ─────────────────────────────────────────
# API REST — Mascotas
# ─────────────────────────────────────────

@login_required
def api_mascotas(request):
    """Lista las mascotas del usuario autenticado."""
    mascotas = Mascota.objects.filter(dueno=request.user).values(
        'id', 'nombre', 'especie', 'raza', 'edad'
    )
    return JsonResponse({'mascotas': list(mascotas)})


@login_required
@require_POST
def api_crear_mascota(request):
    """Registra una nueva mascota para el usuario."""
    try:
        datos   = json.loads(request.body)
        nombre  = datos.get('nombre',  '').strip()
        especie = datos.get('especie', '').strip()
        raza    = datos.get('raza',    '').strip()
        edad    = datos.get('edad',    None)
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'ok': False, 'error': 'Datos inválidos.'}, status=400)

    if not nombre or not especie:
        return JsonResponse({'ok': False, 'error': 'Nombre y especie son obligatorios.'}, status=400)

    mascota = Mascota.objects.create(
        dueno=request.user,
        nombre=nombre,
        especie=especie,
        raza=raza,
        edad=edad,
    )
    return JsonResponse({'ok': True, 'id': mascota.id}, status=201)


# ─────────────────────────────────────────
# API REST — Productos
# ─────────────────────────────────────────

def api_productos(request):
    """Lista los productos activos de la tienda."""
    productos = Producto.objects.filter(activo=True).values(
        'id', 'nombre', 'descripcion', 'precio', 'categoria', 'imagen_url'
    )
    return JsonResponse({'productos': list(productos)})
