from django.db import models
from django.contrib.auth.models import User


# ─────────────────────────────────────────
# MASCOTAS
# ─────────────────────────────────────────

class Mascota(models.Model):
    ESPECIES = [('perro','Perro'),('gato','Gato'),('otro','Otro')]
    dueno   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mascotas')
    nombre  = models.CharField(max_length=100)
    especie = models.CharField(max_length=50, choices=ESPECIES, default='perro')
    raza    = models.CharField(max_length=100, blank=True)
    edad    = models.PositiveIntegerField(null=True, blank=True)
    peso    = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    creado  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return f'{self.nombre} ({self.dueno.username})'


# ─────────────────────────────────────────
# HISTORIAL CLÍNICO (VM-76)
# ─────────────────────────────────────────

class ConsultaClinica(models.Model):
    """Registro de consulta médica con constantes vitales y diagnóstico."""
    mascota      = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='consultas')
    veterinario  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='consultas_vet')
    fecha        = models.DateTimeField()
    motivo       = models.TextField()
    peso         = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperatura  = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    frecuencia_cardiaca = models.PositiveIntegerField(null=True, blank=True)
    diagnostico  = models.TextField(blank=True)
    tratamiento  = models.TextField(blank=True)
    examenes     = models.TextField(blank=True)
    cita         = models.ForeignKey('Cita', on_delete=models.SET_NULL, null=True, blank=True)
    creado       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.mascota.nombre} — {self.fecha.date()}'


class Receta(models.Model):
    """Formulación de medicamentos para una consulta."""
    consulta     = models.ForeignKey(ConsultaClinica, on_delete=models.CASCADE, related_name='recetas')
    medicamento  = models.CharField(max_length=200)
    dosis        = models.CharField(max_length=100)
    frecuencia   = models.CharField(max_length=100)
    dias         = models.PositiveIntegerField()
    indicaciones = models.TextField(blank=True)

    def __str__(self):
        return f'{self.medicamento} — {self.consulta.mascota.nombre}'


class Vacunacion(models.Model):
    """Registro de vacunación y desparasitación."""
    mascota        = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='vacunaciones')
    veterinario    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    vacuna         = models.CharField(max_length=200)
    lote           = models.CharField(max_length=100, blank=True)
    fecha          = models.DateField()
    proxima_dosis  = models.DateField(null=True, blank=True)
    tipo           = models.CharField(max_length=20, choices=[('vacuna','Vacuna'),('desparasitante','Desparasitante')], default='vacuna')
    creado         = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f'{self.vacuna} — {self.mascota.nombre}'


class ArchivoMedico(models.Model):
    """Archivos adjuntos a una consulta (ecografías, radiografías, laboratorios)."""
    CATEGORIAS = [
        ('laboratorio',   'Laboratorio'),
        ('imagenologia',  'Imagenología'),
        ('otro',          'Otro'),
    ]
    consulta    = models.ForeignKey(ConsultaClinica, on_delete=models.CASCADE, related_name='archivos')
    categoria   = models.CharField(max_length=20, choices=CATEGORIAS, default='otro')
    descripcion = models.CharField(max_length=200, blank=True)
    archivo     = models.FileField(upload_to='historiales/')
    subido      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.categoria} — {self.consulta.mascota.nombre}'


# ─────────────────────────────────────────
# CITAS
# ─────────────────────────────────────────

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
        return f'{self.mascota} — {self.servicio} ({self.fecha})'


# ─────────────────────────────────────────
# PRODUCTOS E INVENTARIO
# ─────────────────────────────────────────

class Producto(models.Model):
    CATEGORIAS = [
        ('alimento',    'Alimento'),
        ('medicamento', 'Medicamento'),
        ('accesorio',   'Accesorio'),
        ('higiene',     'Higiene'),
        ('otro',        'Otro'),
    ]
    nombre       = models.CharField(max_length=200)
    descripcion  = models.TextField(blank=True)
    precio       = models.DecimalField(max_digits=10, decimal_places=2)
    costo        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    categoria    = models.CharField(max_length=50, choices=CATEGORIAS, default='otro')
    stock        = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=5)  # alerta de stock bajo
    imagen_url   = models.URLField(blank=True)
    activo       = models.BooleanField(default=True)
    creado       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

    @property
    def stock_bajo(self):
        return self.stock <= self.stock_minimo


class LoteProducto(models.Model):
    """Control de lotes y fechas de vencimiento."""
    producto        = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='lotes')
    numero_lote     = models.CharField(max_length=100)
    cantidad        = models.IntegerField()
    fecha_venc      = models.DateField(null=True, blank=True)
    creado          = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_venc']

    def __str__(self):
        return f'{self.producto.nombre} — Lote {self.numero_lote}'


# ─────────────────────────────────────────
# PROVEEDORES (VM-77)
# ─────────────────────────────────────────

class Proveedor(models.Model):
    razon_social    = models.CharField(max_length=200)
    nit             = models.CharField(max_length=20, unique=True)
    contacto        = models.CharField(max_length=100, blank=True)
    telefono        = models.CharField(max_length=20, blank=True)
    correo          = models.EmailField(blank=True, unique=True)
    direccion       = models.TextField(blank=True)
    dias_credito    = models.PositiveIntegerField(default=0)
    dias_entrega    = models.PositiveIntegerField(default=1)
    activo          = models.BooleanField(default=True)
    creado          = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['razon_social']

    def __str__(self):
        return f'{self.razon_social} ({self.nit})'


class ProductoProveedor(models.Model):
    """Catálogo de productos que suministra cada proveedor."""
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='catalogo')
    producto  = models.ForeignKey(Producto,  on_delete=models.CASCADE, related_name='proveedores')
    costo     = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('proveedor', 'producto')

    def __str__(self):
        return f'{self.proveedor} → {self.producto}'


# ─────────────────────────────────────────
# COMPRAS E INVENTARIO (VM-78)
# ─────────────────────────────────────────

class OrdenCompra(models.Model):
    ESTADOS = [
        ('pendiente',         'Pendiente'),
        ('recibida',          'Recibida'),
        ('recibida_parcial',  'Recibida Parcial'),
        ('anulada',           'Anulada'),
    ]
    proveedor       = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='ordenes')
    fecha           = models.DateField()
    entrega_estimada= models.DateField(null=True, blank=True)
    forma_pago      = models.CharField(max_length=50, blank=True)
    subtotal        = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva             = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total           = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado          = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    motivo_anulacion= models.TextField(blank=True)
    creado_por      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    creado          = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return f'OC-{self.pk} — {self.proveedor} ({self.estado})'


class ItemOrdenCompra(models.Model):
    """Ítems de una orden de compra."""
    orden    = models.ForeignKey(OrdenCompra, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto,    on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal       = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.cantidad * self.costo_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.producto.nombre} x{self.cantidad}'


class DevolucionProveedor(models.Model):
    """Devolución de productos a un proveedor."""
    orden    = models.ForeignKey(OrdenCompra, on_delete=models.CASCADE, related_name='devoluciones')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    motivo   = models.TextField()
    fecha    = models.DateField(auto_now_add=True)

    def __str__(self):
        return f'Dev {self.producto.nombre} — {self.orden}'


# ─────────────────────────────────────────
# NOTIFICACIONES
# ─────────────────────────────────────────

class Notificacion(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    leida   = models.BooleanField(default=False)
    creado  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return f'{self.usuario.username} — {self.mensaje[:40]}'
