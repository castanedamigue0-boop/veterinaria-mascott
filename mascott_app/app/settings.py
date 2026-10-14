from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────
# SEGURIDAD
# En producción cambiar DEBUG=False y
# configurar SECRET_KEY desde variable de entorno.
# ─────────────────────────────────────────
SECRET_KEY = 'django-insecure-mascott-2026-cambiar-en-produccion'
DEBUG      = True
ALLOWED_HOSTS = ['*']

# ─────────────────────────────────────────
# APLICACIONES INSTALADAS
# ─────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'mascott',
]

# ─────────────────────────────────────────
# MIDDLEWARE — capas de seguridad
# ─────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',        # protección CSRF
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # anti-iframe
]

ROOT_URLCONF = 'app.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

WSGI_APPLICATION = 'app.wsgi.application'

# ─────────────────────────────────────────
# BASE DE DATOS — SQLite para desarrollo
# En producción usar PostgreSQL o MySQL
# ─────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ─────────────────────────────────────────
# VALIDACIÓN DE CONTRASEÑAS
# ─────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─────────────────────────────────────────
# INTERNACIONALIZACIÓN
# ─────────────────────────────────────────
LANGUAGE_CODE = 'es-co'
TIME_ZONE     = 'America/Bogota'
USE_I18N      = True
USE_TZ        = True

# ─────────────────────────────────────────
# ARCHIVOS ESTÁTICOS
# ─────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ─────────────────────────────────────────
# SESIONES — seguridad de cookies
# ─────────────────────────────────────────
SESSION_COOKIE_HTTPONLY = True   # JS no puede leer la cookie de sesión
SESSION_COOKIE_SAMESITE = 'Lax'  # protección CSRF adicional
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # sesión dura 7 días

# CSRF
CSRF_COOKIE_HTTPONLY = False  # el frontend necesita leer el token CSRF
CSRF_COOKIE_SAMESITE = 'Lax'

# Cabeceras de seguridad
SECURE_CONTENT_TYPE_NOSNIFF = True  # evita que el browser adivine el tipo MIME
X_FRAME_OPTIONS = 'DENY'            # nadie puede embeber el sitio en un iframe

# ─────────────────────────────────────────
# CORS — permitir peticiones desde el frontend estático
# ─────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5502',
    'http://localhost:5502',
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
