from django.urls import path
from . import views

urlpatterns = [
    # ── Páginas HTML ──
    path('',             views.inicio,          name='inicio'),
    path('login/',       views.login_registro,  name='login_registro'),
    path('logout/',      views.cerrar_sesion,   name='cerrar_sesion'),
    path('panel/',       views.dashboard,       name='dashboard'),
    path('admin-panel/', views.panel_admin,     name='panel_admin'),
    path('tienda/',      views.tienda,          name='tienda'),
    path('calendario/',  views.calendario,      name='calendario'),

    # ── API Autenticación ──
    path('api/csrf/',            views.api_csrf,           name='api_csrf'),
    path('api/sesion/',          views.api_sesion,         name='api_sesion'),
    path('api/login/',           views.api_login,          name='api_login'),
    path('api/registro/',        views.api_registro,       name='api_registro'),
    path('api/logout/',          views.api_logout,         name='api_logout'),

    # ── API Citas ──
    path('api/citas/',           views.api_citas,          name='api_citas'),
    path('api/citas/crear/',     views.api_crear_cita,     name='api_crear_cita'),
    path('api/citas/horarios/',  views.api_horas_ocupadas, name='api_horas_ocupadas'),

    # ── API Mascotas ──
    path('api/mascotas/',        views.api_mascotas,       name='api_mascotas'),
    path('api/mascotas/crear/',  views.api_crear_mascota,  name='api_crear_mascota'),

    # ── API Historial Clínico (VM-76) ──
    path('api/historial/<int:mascota_id>/', views.api_historial,        name='api_historial'),
    path('api/consultas/crear/',            views.api_crear_consulta,   name='api_crear_consulta'),
    path('api/vacunaciones/crear/',         views.api_crear_vacunacion, name='api_crear_vacunacion'),

    # ── API Productos ──
    path('api/productos/',        views.api_productos,      name='api_productos'),
    path('api/productos/crear/',  views.api_crear_producto, name='api_crear_producto'),

    # ── API Proveedores (VM-77) ──
    path('api/proveedores/',                         views.api_proveedores,      name='api_proveedores'),
    path('api/proveedores/crear/',                   views.api_crear_proveedor,  name='api_crear_proveedor'),
    path('api/proveedores/<int:proveedor_id>/toggle/', views.api_toggle_proveedor, name='api_toggle_proveedor'),

    # ── API Órdenes de Compra (VM-78) ──
    path('api/ordenes/',                       views.api_ordenes,       name='api_ordenes'),
    path('api/ordenes/crear/',                 views.api_crear_orden,   name='api_crear_orden'),
    path('api/ordenes/<int:orden_id>/recibir/', views.api_recibir_orden, name='api_recibir_orden'),
    path('api/ordenes/<int:orden_id>/anular/',  views.api_anular_orden,  name='api_anular_orden'),

    # ── API Stats ──
    path('api/stats/', views.api_stats, name='api_stats'),
]
