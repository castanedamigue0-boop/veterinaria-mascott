"""
Señales automáticas de Django — Veterinaria Mascott
Se ejecutan cuando ocurren eventos en la base de datos.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Cita, Notificacion


@receiver(post_save, sender=Cita)
def notificar_nueva_cita(sender, instance, created, **kwargs):
    """Notifica al usuario cuando agenda una nueva cita."""
    if created:
        Notificacion.objects.create(
            usuario=instance.usuario,
            mensaje=(
                f'📅 Tu cita de {instance.servicio} para {instance.mascota} '
                f'el {instance.fecha} a las {instance.hora} fue agendada correctamente. '
                f'Espera confirmación del veterinario.'
            )
        )
