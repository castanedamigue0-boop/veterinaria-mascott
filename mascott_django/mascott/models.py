from django.db import models
from django.contrib.auth.models import User


# ─── MASCOTA ────────────────────────────────────────────────────────────────
class Mascota(models.Model):
    ESPECIES = [
        ('🐕 Perro',  'Perro'),
        ('🐈 Gato',   'Gato'),
        ('🐇 Conejo', 'Conejo'),
        ('🐦 Ave',    'Ave'),
        ('Otro',      'Otro'),
    ]
    dueno   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mascotas')
    nombre  = models.CharField(max_length=100)
    especie = models.CharField(max_length=20, choices=ESPECIES)
    raza    = models.CharField(max_length=100, blank=True)
    edad    = models.PositiveSmallIntegerField(null=True, blank=True, help_text='Edad en años')
    creado  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.nombre} ({self.especie}) — {self.dueno.get_full_name()}'

    class Meta:
        verbose_name = 'Mascota'
        verbose_name_plural = 'Mascotas'
        ordering = ['nombre']


# ─── CITA ────────────────────────────────────────────────────────────────────
class Cita(models.Model):
    SERVICIOS = [
        ('Consulta general',   'Consulta general'),
        ('💉 Vacunación',      'Vacunación'),
        ('✂️ Baño y peluquería','Baño y peluquería'),
        ('🦷 Limpieza dental', 'Limpieza dental'),
        ('🔬 Análisis clínico','Análisis clínico'),
        ('🩺 Revisión anual',  'Revisión anual'),
        ('💊 Desparasitación', 'Desparasitación'),
    ]
    HORARIOS = [
        ('08:00 am', '08:00 am'), ('09:00 am', '09:00 am'),
        ('10:00 am', '10:00 am'), ('11:00 am', '11:00 am'),
        ('12:00 pm', '12:00 pm'), ('02:00 pm', '02:00 pm'),
        ('03:00 pm', '03:00 pm'), ('04:00 pm', '04:00 pm'),
        ('05:00 pm', '05:00 pm'),
    ]
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada',  'Cancelada'),
        ('completada', 'Completada'),
    ]

    usuario  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='citas')
    mascota  = models.CharField(max_length=100)               # nombre libre
    servicio = models.CharField(max_length=50, choices=SERVICIOS)
    fecha    = models.DateField()
    hora     = models.CharField(max_length=10, choices=HORARIOS)
    notas    = models.TextField(blank=True)
    estado   = models.CharField(max_length=15, choices=ESTADOS, default='pendiente')
    creado   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.servicio} — {self.mascota} [{self.fecha} {self.hora}]'

    class Meta:
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        ordering = ['-fecha', '-hora']


# ─── PRODUCTO ────────────────────────────────────────────────────────────────
class Producto(models.Model):
    ANIMALES = [
        ('perro',  'Perro'),
        ('gato',   'Gato'),
        ('conejo', 'Conejo'),
        ('ave',    'Ave'),
        ('todos',  'Todos'),
    ]
    ETAPAS = [
        ('cachorro', 'Cachorro'),
        ('adulto',   'Adulto'),
        ('senior',   'Senior'),
        ('todos',    'Todos'),
    ]
    CATEGORIAS = [
        ('alimento',  'Alimento'),
        ('snack',     'Snack'),
        ('higiene',   'Higiene'),
        ('salud',     'Salud'),
        ('juguete',   'Juguete'),
        ('accesorio', 'Accesorio'),
    ]
    BADGES = [
        ('',       'Ninguno'),
        ('oferta', 'Oferta'),
        ('nuevo',  'Nuevo'),
    ]

    nombre      = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    marca       = models.CharField(max_length=100)
    precio      = models.DecimalField(max_digits=8, decimal_places=2)
    precio_old  = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    animal      = models.CharField(max_length=10, choices=ANIMALES, default='todos')
    etapa       = models.CharField(max_length=10, choices=ETAPAS,   default='adulto')
    categoria   = models.CharField(max_length=15, choices=CATEGORIAS)
    badge       = models.CharField(max_length=10, choices=BADGES, blank=True)
    emoji       = models.CharField(max_length=5,  blank=True)
    cantidad    = models.PositiveIntegerField(default=0, help_text='Stock disponible')
    activo      = models.BooleanField(default=True)
    creado      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.nombre} — {self.marca}'

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']


# ─── PEDIDO ──────────────────────────────────────────────────────────────────
class Pedido(models.Model):
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('enviado',    'Enviado'),
        ('entregado',  'Entregado'),
        ('cancelado',  'Cancelado'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pedidos')
    fecha   = models.DateTimeField(auto_now_add=True)
    total   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado  = models.CharField(max_length=15, choices=ESTADOS, default='pendiente')
    notas   = models.TextField(blank=True)

    def __str__(self):
        return f'Pedido #{self.pk} — {self.usuario.get_full_name()} — ${self.total}'

    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha']


class ItemPedido(models.Model):
    pedido   = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.SET_NULL, null=True)
    nombre   = models.CharField(max_length=200)   # copia por si se borra el producto
    precio   = models.DecimalField(max_digits=8, decimal_places=2)
    cantidad = models.PositiveSmallIntegerField(default=1)

    @property
    def subtotal(self):
        return self.precio * self.cantidad

    def __str__(self):
        return f'{self.nombre} x{self.cantidad}'

    class Meta:
        verbose_name = 'Item de pedido'
        verbose_name_plural = 'Items de pedido'


# ─── NOTIFICACIÓN ────────────────────────────────────────────────────────────
class Notificacion(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    leida   = models.BooleanField(default=False)
    creado  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'[{"leída" if self.leida else "nueva"}] {self.usuario.username}: {self.mensaje[:50]}'

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-creado']
