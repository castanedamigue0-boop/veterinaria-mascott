from django.urls import path
from . import views

urlpatterns = [
    # Páginas principales
    path('',                    views.inicio,           name='inicio'),
    path('login/',              views.login_registro,   name='login_registro'),
    path('logout/',             views.cerrar_sesion,    name='cerrar_sesion'),
    path('dashboard/',          views.dashboard,        name='dashboard'),
    path('tienda/',             views.tienda,            name='tienda'),

    # Citas
    path('cita/crear/',              views.crear_cita,           name='crear_cita'),
    path('cita/<int:cita_id>/cancelar/', views.cancelar_cita,   name='cancelar_cita'),
    path('horas-ocupadas/',          views.horas_ocupadas,       name='horas_ocupadas'),

    # Mascotas
    path('mascota/crear/',                   views.crear_mascota,    name='crear_mascota'),
    path('mascota/<int:mascota_id>/eliminar/', views.eliminar_mascota, name='eliminar_mascota'),

    # Tienda / Carrito
    path('carrito/',                           views.ver_carrito,       name='ver_carrito'),
    path('carrito/agregar/<int:producto_id>/', views.agregar_carrito,   name='agregar_carrito'),
    path('carrito/actualizar/<int:producto_id>/', views.actualizar_carrito, name='actualizar_carrito'),
    path('carrito/confirmar/',                 views.confirmar_pedido,  name='confirmar_pedido'),

    # Perfil
    path('perfil/actualizar/', views.actualizar_perfil, name='actualizar_perfil'),

    # Panel Administrador
    path('administrador/',                              views.panel_administrador,     name='panel_administrador'),
    path('administrador/cita/<int:cita_id>/estado/',    views.cambiar_estado_cita,     name='cambiar_estado_cita'),
    path('administrador/producto/agregar/',             views.agregar_producto_admin,  name='agregar_producto_admin'),
    path('administrador/producto/<int:producto_id>/eliminar/', views.eliminar_producto_admin, name='eliminar_producto_admin'),
]
