from django.urls import path
from . import views

urlpatterns = [
    # Páginas principales
    path('',             views.inicio,          name='inicio'),
    path('login/',       views.login_registro,  name='login_registro'),
    path('logout/',      views.cerrar_sesion,   name='cerrar_sesion'),
    path('panel/',       views.dashboard,       name='dashboard'),
    path('admin-panel/', views.panel_admin,     name='panel_admin'),
    path('tienda/',      views.tienda,          name='tienda'),
    path('calendario/',  views.calendario,      name='calendario'),

    # API REST — el frontend llama a estas URLs con fetch()
    path('api/csrf/',            views.api_csrf,           name='api_csrf'),
    path('api/sesion/',          views.api_sesion,         name='api_sesion'),
    path('api/login/',           views.api_login,          name='api_login'),
    path('api/registro/',        views.api_registro,       name='api_registro'),
    path('api/logout/',          views.api_logout,         name='api_logout'),
    path('api/citas/',           views.api_citas,          name='api_citas'),
    path('api/citas/crear/',     views.api_crear_cita,     name='api_crear_cita'),
    path('api/citas/horarios/',  views.api_horas_ocupadas, name='api_horas_ocupadas'),
    path('api/mascotas/',        views.api_mascotas,       name='api_mascotas'),
    path('api/mascotas/crear/',  views.api_crear_mascota,  name='api_crear_mascota'),
    path('api/productos/',       views.api_productos,      name='api_productos'),
]
