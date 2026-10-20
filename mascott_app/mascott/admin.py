from django.contrib import admin
from .models import (
    Mascota, Cita, ConsultaClinica, Receta, Vacunacion, ArchivoMedico,
    Producto, LoteProducto, Proveedor, ProductoProveedor,
    OrdenCompra, ItemOrdenCompra, DevolucionProveedor, Notificacion
)

# ── Mascotas ──
@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'especie', 'raza', 'dueno', 'peso', 'creado']
    search_fields = ['nombre', 'dueno__username']
    list_filter   = ['especie']

# ── Citas ──
@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display  = ['mascota', 'servicio', 'fecha', 'hora', 'estado', 'usuario']
    list_filter   = ['estado', 'fecha']
    list_editable = ['estado']

# ── Historial Clínico ──
class RecetaInline(admin.TabularInline):
    model = Receta
    extra = 1

class ArchivoInline(admin.TabularInline):
    model = ArchivoMedico
    extra = 0

@admin.register(ConsultaClinica)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ['mascota', 'veterinario', 'fecha', 'motivo']
    list_filter  = ['fecha', 'veterinario']
    inlines      = [RecetaInline, ArchivoInline]

@admin.register(Vacunacion)
class VacunacionAdmin(admin.ModelAdmin):
    list_display = ['vacuna', 'tipo', 'mascota', 'fecha', 'proxima_dosis', 'veterinario']
    list_filter  = ['tipo', 'fecha']

# ── Productos ──
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'categoria', 'precio', 'stock', 'stock_minimo', 'activo']
    list_filter   = ['activo', 'categoria']
    list_editable = ['activo', 'precio', 'stock']

@admin.register(LoteProducto)
class LoteAdmin(admin.ModelAdmin):
    list_display = ['producto', 'numero_lote', 'cantidad', 'fecha_venc']
    list_filter  = ['fecha_venc']

# ── Proveedores ──
class CatalogoInline(admin.TabularInline):
    model = ProductoProveedor
    extra = 1

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display  = ['razon_social', 'nit', 'contacto', 'telefono', 'activo']
    list_filter   = ['activo']
    search_fields = ['razon_social', 'nit']
    list_editable = ['activo']
    inlines       = [CatalogoInline]

# ── Órdenes de Compra ──
class ItemOrdenInline(admin.TabularInline):
    model = ItemOrdenCompra
    extra = 1

class DevolucionInline(admin.TabularInline):
    model = DevolucionProveedor
    extra = 0

@admin.register(OrdenCompra)
class OrdenCompraAdmin(admin.ModelAdmin):
    list_display  = ['pk', 'proveedor', 'fecha', 'total', 'estado']
    list_filter   = ['estado', 'fecha']
    list_editable = ['estado']
    inlines       = [ItemOrdenInline, DevolucionInline]

# ── Notificaciones ──
@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display  = ['usuario', 'mensaje', 'leida', 'creado']
    list_filter   = ['leida']
    list_editable = ['leida']
