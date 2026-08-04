"""
Script para cargar datos iniciales: productos del catálogo + superusuario admin.
Ejecutar con: python manage.py shell < cargar_datos.py
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mascott_django.settings')
django.setup()

from django.contrib.auth.models import User
from mascott.models import Producto

# ── SUPERUSUARIO ADMIN ──────────────────────────────────────────────────────
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@mascott.com',
        password='mascott2026',
        first_name='Administrador',
        last_name='Mascott',
    )
    print('✅ Superusuario creado: admin / mascott2026')
else:
    print('ℹ️  Superusuario ya existe.')

# ── CATÁLOGO DE PRODUCTOS ───────────────────────────────────────────────────
productos = [
    # PERRO - CACHORRO
    dict(nombre='Royal Canin Cachorro 3kg',       animal='perro', etapa='cachorro', categoria='alimento',  precio=420, precio_old=480,  marca='Royal Canin',    emoji='🦴', descripcion='Fórmula especial para cachorros hasta 12 meses. Refuerza el sistema inmune.', badge='oferta', cantidad=20),
    dict(nombre='Purina Pro Plan Cachorro 4kg',   animal='perro', etapa='cachorro', categoria='alimento',  precio=390, precio_old=None, marca='Purina',         emoji='🍖', descripcion='Proteína de pollo real como primer ingrediente.', badge='nuevo', cantidad=15),
    dict(nombre='Snack Dental Cachorro x20',      animal='perro', etapa='cachorro', categoria='snack',     precio=120, precio_old=None, marca='Pedigree',       emoji='🦷', descripcion='Cuida los dientes desde pequeño. Sin colorantes artificiales.', badge='', cantidad=30),
    dict(nombre='Collar Ajustable Cachorro',      animal='perro', etapa='cachorro', categoria='accesorio', precio=85,  precio_old=None, marca='PetStyle',       emoji='🎀', descripcion='Collar suave de nylon, ajustable de 20 a 35 cm.', badge='', cantidad=25),
    # PERRO - ADULTO
    dict(nombre="Hill's Science Diet Adulto 7kg", animal='perro', etapa='adulto',   categoria='alimento',  precio=650, precio_old=720,  marca="Hill's",         emoji='🐕', descripcion='Nutrición balanceada para perros adultos activos.', badge='oferta', cantidad=10),
    dict(nombre='Eukanuba Adulto Razas Grandes',  animal='perro', etapa='adulto',   categoria='alimento',  precio=580, precio_old=None, marca='Eukanuba',       emoji='🦮', descripcion='Especial para razas grandes. Cuida articulaciones.', badge='', cantidad=8),
    dict(nombre='Shampoo Perro Pelo Corto 500ml', animal='perro', etapa='adulto',   categoria='higiene',   precio=95,  precio_old=None, marca='BioGroom',       emoji='🧴', descripcion='Fórmula suave con aloe vera. Deja el pelo brillante.', badge='', cantidad=20),
    dict(nombre='Juguete Kong Classic M',         animal='perro', etapa='adulto',   categoria='juguete',   precio=210, precio_old=None, marca='Kong',           emoji='🧸', descripcion='Resistente caucho natural. Ideal para rellenar con premios.', badge='nuevo', cantidad=15),
    dict(nombre='Antipulgas Spot-On Perro',       animal='perro', etapa='adulto',   categoria='salud',     precio=180, precio_old=200,  marca='Frontline',      emoji='💊', descripcion='Protección 30 días contra pulgas y garrapatas.', badge='oferta', cantidad=40),
    dict(nombre='Cama Ortopédica Perro M',        animal='perro', etapa='adulto',   categoria='accesorio', precio=450, precio_old=None, marca='PetComfort',     emoji='🛏️', descripcion='Espuma viscoelástica. Ideal para perros con artritis.', badge='', cantidad=5),
    # PERRO - SENIOR
    dict(nombre='Royal Canin Senior 8+ 3kg',      animal='perro', etapa='senior',   categoria='alimento',  precio=480, precio_old=520,  marca='Royal Canin',    emoji='👴', descripcion='Fórmula adaptada para perros mayores de 8 años.', badge='oferta', cantidad=12),
    dict(nombre='Suplemento Articular Perro',     animal='perro', etapa='senior',   categoria='salud',     precio=260, precio_old=None, marca='Vetri-Science',  emoji='💊', descripcion='Glucosamina y condroitina para articulaciones sanas.', badge='', cantidad=18),
    # GATO - CACHORRO
    dict(nombre='Royal Canin Kitten 2kg',         animal='gato',  etapa='cachorro', categoria='alimento',  precio=350, precio_old=390,  marca='Royal Canin',    emoji='🐱', descripcion='Nutrición completa para gatitos hasta 12 meses.', badge='oferta', cantidad=20),
    dict(nombre='Juguete Ratón con Catnip',       animal='gato',  etapa='cachorro', categoria='juguete',   precio=65,  precio_old=None, marca='Catit',          emoji='🐭', descripcion='Estimula el instinto cazador. Con hierba gatera natural.', badge='', cantidad=35),
    # GATO - ADULTO
    dict(nombre='Whiskas Adulto Pollo 3kg',       animal='gato',  etapa='adulto',   categoria='alimento',  precio=280, precio_old=None, marca='Whiskas',        emoji='🐈', descripcion='Croquetas con pollo real. Apoya la salud urinaria.', badge='', cantidad=22),
    dict(nombre='Arena Sanitaria Aglomerante 5kg',animal='gato',  etapa='adulto',   categoria='higiene',   precio=130, precio_old=150,  marca='Ever Clean',     emoji='🪣', descripcion='Control de olores 7 días. Aglomeración instantánea.', badge='oferta', cantidad=30),
    dict(nombre='Rascador Torre Gato',            animal='gato',  etapa='adulto',   categoria='accesorio', precio=320, precio_old=None, marca='Catit',          emoji='🗼', descripcion='Sisal natural, plataforma superior y juguete colgante.', badge='nuevo', cantidad=8),
    dict(nombre='Snack Temptations Gato x85g',   animal='gato',  etapa='adulto',   categoria='snack',     precio=75,  precio_old=None, marca='Temptations',    emoji='🍗', descripcion='Crujientes por fuera, suaves por dentro. Irresistibles.', badge='', cantidad=50),
    dict(nombre='Antipulgas Gato Spot-On',        animal='gato',  etapa='adulto',   categoria='salud',     precio=160, precio_old=180,  marca='Frontline',      emoji='💊', descripcion='Protección mensual contra pulgas y garrapatas.', badge='oferta', cantidad=35),
    # GATO - SENIOR
    dict(nombre="Hill's Science Diet Gato 7+",    animal='gato',  etapa='senior',   categoria='alimento',  precio=390, precio_old=None, marca="Hill's",         emoji='🐈', descripcion='Cuida riñones y articulaciones en gatos mayores.', badge='', cantidad=10),
    # CONEJO
    dict(nombre='Alimento Conejo Adulto 1.5kg',   animal='conejo',etapa='adulto',   categoria='alimento',  precio=150, precio_old=None, marca='Versele-Laga',   emoji='🐇', descripcion='Mezcla de heno, verduras y cereales. Sin colorantes.', badge='', cantidad=15),
    dict(nombre='Jaula Conejo Mediana',            animal='conejo',etapa='adulto',   categoria='accesorio', precio=520, precio_old=600,  marca='Ferplast',       emoji='🏠', descripcion='Jaula con bandeja extraíble y comedero incluido.', badge='oferta', cantidad=4),
    dict(nombre='Snack Heno Timothy Conejo',      animal='conejo',etapa='adulto',   categoria='snack',     precio=90,  precio_old=None, marca='Oxbow',          emoji='🌾', descripcion='Heno de primera calidad. Esencial para la digestión.', badge='nuevo', cantidad=25),
    # AVE
    dict(nombre='Alimento Periquito Mezcla 1kg',  animal='ave',   etapa='adulto',   categoria='alimento',  precio=95,  precio_old=None, marca='Versele-Laga',   emoji='🐦', descripcion='Mezcla de semillas seleccionadas para periquitos.', badge='', cantidad=20),
    dict(nombre='Jaula Canario Decorativa',       animal='ave',   etapa='adulto',   categoria='accesorio', precio=380, precio_old=420,  marca='Ferplast',       emoji='🏡', descripcion='Diseño elegante con comederos y bebederos incluidos.', badge='oferta', cantidad=6),
    dict(nombre='Vitaminas Aves Líquidas 30ml',   animal='ave',   etapa='adulto',   categoria='salud',     precio=110, precio_old=None, marca='Nekton',         emoji='💧', descripcion='Complejo vitamínico para aves en época de muda.', badge='', cantidad=18),
]

creados = 0
for p in productos:
    if not Producto.objects.filter(nombre=p['nombre']).exists():
        Producto.objects.create(**p)
        creados += 1

print(f'✅ {creados} productos cargados. Total en BD: {Producto.objects.count()}')
print('\n🎉 Datos iniciales listos.')
print('   Admin:  http://127.0.0.1:8000/django-admin/')
print('   Usuario: admin  |  Contraseña: mascott2026')
