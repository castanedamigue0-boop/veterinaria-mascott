from django.urls import path
from . import views

urlpatterns = [
    # ── Páginas HTML ──
    path('',          views.inicio,         name='inicio'),
    path('login/',    views.login_registro,  name='login_registro'),
    path('logout/',   views.cerrar_sesion,   name='cerrar_sesion'),
    path('panel/',    views.dashboard,       name='dashboard'),

    # ── API REST — Autenticación ──
    path('api/csrf/',     views.api_csrf,    name='api_csrf'),
    path('api/sesion/',   views.api_sesion,  name='api_sesion'),
    path('api/login/',    views.api_login,   name='api_login'),
    path('api/registro/', views.api_registro, name='api_registro'),
    path('api/logout/',   views.api_logout,  name='api_logout'),

    # ── API REST — Citas ──
    path('api/citas/',          views.api_citas,         name='api_citas'),
    path('api/citas/crear/',    views.api_crear_cita,    name='api_crear_cita'),
    path('api/citas/horarios/', views.api_horas_ocupadas, name='api_horas_ocupadas'),

    # ── API REST — Mascotas ──
    path('api/mascotas/',        views.api_mascotas,      name='api_mascotas'),
    path('api/mascotas/crear/',  views.api_crear_mascota, name='api_crear_mascota'),

    # ── API REST — Productos ──
    path('api/productos/', views.api_productos, name='api_productos'),
]
