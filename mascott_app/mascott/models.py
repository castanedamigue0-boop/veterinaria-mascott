from django.db import models
from django.contrib.auth.models import User


# Mascota registrada por un usuario
class Mascota(models.Model):
    dueno   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mascotas')
    nombre  = models.CharField(max_length=100)
    especie = models.CharField(max_length=50)
    raza    = models.CharField(max_length=100, blank=True)
    edad    = models.PositiveIntegerField(null=True, blank=True)
    creado  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} — {self.dueno.username}'


# Cita médica agendada por un usuario
class Cita(models.Model):
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada',  'Cancelada'),
        ('completada', 'Completada'),
    ]
    usuario  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='citas')
    mascota  = models.CharField(max_length=100)
    servicio = models.CharField(max_length=100)
    fecha    = models.DateField()
    hora     = models.CharField(max_length=10)
    notas    = models.TextField(blank=True)
    estado   = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    creado   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha', '-creado']

    def __str__(self):
        return f'{self.mascota} — {self.servicio} ({self.fecha} {self.hora})'


# Producto de la tienda
class Producto(models.Model):
    nombre      = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    precio      = models.DecimalField(max_digits=10, decimal_places=2)
    categoria   = models.CharField(max_length=50, blank=True)
    imagen_url  = models.URLField(blank=True)
    activo      = models.BooleanField(default=True)
    creado      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# Notificación para el usuario
class Notificacion(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    leida   = models.BooleanField(default=False)
    creado  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return f'{self.usuario.username} — {self.mensaje[:40]}'
