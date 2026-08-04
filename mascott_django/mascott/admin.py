from django.contrib import admin
from django.utils.html import format_html
from .models import Mascota, Cita, Producto, Pedido, ItemPedido, Notificacion


@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'especie', 'raza', 'edad', 'dueno')
    list_filter   = ('especie',)
    search_fields = ('nombre', 'dueno__username', 'dueno__first_name')


class ItemPedidoInline(admin.TabularInline):
    model  = ItemPedido
    extra  = 0
    fields = ('nombre', 'precio', 'cantidad', 'subtotal_display')
    readonly_fields = ('subtotal_display',)

    def subtotal_display(self, obj):
        return f'${obj.subtotal}'
    subtotal_display.short_description = 'Subtotal'


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display  = ('servicio', 'mascota', 'usuario', 'fecha', 'hora', 'estado', 'estado_badge')
    list_filter   = ('estado', 'fecha', 'servicio')
    search_fields = ('mascota', 'usuario__username', 'usuario__first_name')
    list_editable = ('estado',)
    date_hierarchy = 'fecha'

    def estado_badge(self, obj):
        colores = {
            'pendiente':  '#e65100',
            'confirmada': '#2e7d32',
            'cancelada':  '#c62828',
            'completada': '#1565c0',
        }
        color = colores.get(obj.estado, '#555')
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:20px;font-size:.8rem">{}</span>',
            color, obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'marca', 'animal', 'categoria', 'precio', 'cantidad', 'activo')
    list_filter   = ('animal', 'categoria', 'etapa', 'activo')
    search_fields = ('nombre', 'marca')
    list_editable = ('precio', 'cantidad', 'activo')


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'fecha', 'total', 'estado')
    list_filter  = ('estado', 'fecha')
    search_fields = ('usuario__username', 'usuario__first_name')
    inlines      = [ItemPedidoInline]


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'mensaje', 'leida', 'creado')
    list_filter  = ('leida',)


# Personalizar título del admin
admin.site.site_header = '🐾 Veterinaria Mascott — Administración'
admin.site.site_title  = 'Mascott Admin'
admin.site.index_title = 'Panel de Control'
