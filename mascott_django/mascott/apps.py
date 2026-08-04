from django.apps import AppConfig


class MascottConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name         = "mascott"
    verbose_name = "🐾 Veterinaria Mascott"

    def ready(self):
        import mascott.signals  # noqa: F401 — registrar señales al iniciar
