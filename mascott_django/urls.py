from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),   # panel admin de Django
    path('', include('mascott.urls')),         # todas las rutas de la app
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
