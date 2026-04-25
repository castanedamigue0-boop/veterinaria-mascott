// ===== FIREBASE (guardar pedido si hay sesión) =====
import { obtenerUsuario, actualizarUsuario, getSession } from './firebase.js';

// ===== STOCK (sincronizado con inventario admin) =====
const INV_KEY = 'mascott_inventario';
function getStock(prodId) {
  try {
    var inv = JSON.parse(localStorage.getItem(INV_KEY) || '[]');
    var item = inv.find(function(p) { return p.id === prodId; });
    return item !== undefined ? (item.cantidad || 0) : 99;
  } catch(e) { return 99; }
}

// ===== RUTA BASE DE IMÁGENES =====
const IMG = 'img/';

// ===== CATÁLOGO DE PRODUCTOS =====
const PRODUCTOS = [
  { id:1,  nombre:'Royal Canin Cachorro 3kg',          animal:'perro',  etapa:'cachorro', cat:'alimento',  precio:420, precioOld:480,  marca:'Royal Canin',   img:IMG+'image1.png',  desc:'Fórmula especial para cachorros hasta 12 meses. Refuerza el sistema inmune.', badge:'oferta' },
  { id:2,  nombre:'Purina Pro Plan Cachorro 4kg',      animal:'perro',  etapa:'cachorro', cat:'alimento',  precio:390, precioOld:null, marca:'Purina',        img:IMG+'image2.png',  desc:'Proteína de pollo real como primer ingrediente.', badge:'nuevo' },
  { id:3,  nombre:'Snack Dental Cachorro x20',         animal:'perro',  etapa:'cachorro', cat:'snack',     precio:120, precioOld:null, marca:'Pedigree',      img:IMG+'image3.png',  desc:'Cuida los dientes desde pequeño. Sin colorantes artificiales.', badge:null },
  { id:4,  nombre:'Collar Ajustable Cachorro',         animal:'perro',  etapa:'cachorro', cat:'accesorio', precio:85,  precioOld:null, marca:'PetStyle',      img:IMG+'image4.png',  desc:'Collar suave de nylon, ajustable de 20 a 35 cm.', badge:null },
  { id:5,  nombre:"Hill's Science Diet Adulto 7kg",    animal:'perro',  etapa:'adulto',   cat:'alimento',  precio:650, precioOld:720,  marca:"Hill's",        img:IMG+'image5.png',  desc:'Nutrición balanceada para perros adultos activos.', badge:'oferta' },
  { id:6,  nombre:'Eukanuba Adulto Razas Grandes',     animal:'perro',  etapa:'adulto',   cat:'alimento',  precio:580, precioOld:null, marca:'Eukanuba',      img:IMG+'image6.png',  desc:'Especial para razas grandes. Cuida articulaciones.', badge:null },
  { id:7,  nombre:'Shampoo Perro Pelo Corto 500ml',    animal:'perro',  etapa:'adulto',   cat:'higiene',   precio:95,  precioOld:null, marca:'BioGroom',      img:IMG+'image7.png',  desc:'Fórmula suave con aloe vera. Deja el pelo brillante.', badge:null },
  { id:8,  nombre:'Juguete Kong Classic M',            animal:'perro',  etapa:'adulto',   cat:'juguete',   precio:210, precioOld:null, marca:'Kong',          img:IMG+'image8.png',  desc:'Resistente caucho natural. Ideal para rellenar con premios.', badge:'nuevo' },
  { id:9,  nombre:'Antipulgas Spot-On Perro',          animal:'perro',  etapa:'adulto',   cat:'salud',     precio:180, precioOld:200,  marca:'Frontline',     img:IMG+'image9.png',  desc:'Protección 30 días contra pulgas y garrapatas.', badge:'oferta' },
  { id:10, nombre:'Cama Ortopédica Perro M',           animal:'perro',  etapa:'adulto',   cat:'accesorio', precio:450, precioOld:null, marca:'PetComfort',    img:IMG+'image10.png', desc:'Espuma viscoelástica. Ideal para perros con artritis.', badge:null },
  { id:11, nombre:'Royal Canin Senior 8+ 3kg',         animal:'perro',  etapa:'senior',   cat:'alimento',  precio:480, precioOld:520,  marca:'Royal Canin',   img:IMG+'image11.png', desc:'Fórmula adaptada para perros mayores de 8 años.', badge:'oferta' },
  { id:12, nombre:'Suplemento Articular Perro',        animal:'perro',  etapa:'senior',   cat:'salud',     precio:260, precioOld:null, marca:'Vetri-Science', img:IMG+'image12.png', desc:'Glucosamina y condroitina para articulaciones sanas.', badge:null },
  { id:13, nombre:'Royal Canin Kitten 2kg',            animal:'gato',   etapa:'cachorro', cat:'alimento',  precio:350, precioOld:390,  marca:'Royal Canin',   img:IMG+'image13.png', desc:'Nutrición completa para gatitos hasta 12 meses.', badge:'oferta' },
  { id:14, nombre:'Juguete Ratón con Catnip',          animal:'gato',   etapa:'cachorro', cat:'juguete',   precio:65,  precioOld:null, marca:'Catit',         img:IMG+'image14.png', desc:'Estimula el instinto cazador. Con hierba gatera natural.', badge:null },
  { id:15, nombre:'Whiskas Adulto Pollo 3kg',          animal:'gato',   etapa:'adulto',   cat:'alimento',  precio:280, precioOld:null, marca:'Whiskas',       img:IMG+'image15.png', desc:'Croquetas con pollo real. Apoya la salud urinaria.', badge:null },
  { id:16, nombre:'Arena Sanitaria Aglomerante 5kg',   animal:'gato',   etapa:'adulto',   cat:'higiene',   precio:130, precioOld:150,  marca:'Ever Clean',    img:IMG+'image16.png', desc:'Control de olores 7 días. Aglomeración instantánea.', badge:'oferta' },
  { id:17, nombre:'Rascador Torre Gato',               animal:'gato',   etapa:'adulto',   cat:'accesorio', precio:320, precioOld:null, marca:'Catit',         img:IMG+'image17.png', desc:'Sisal natural, plataforma superior y juguete colgante.', badge:'nuevo' },
  { id:18, nombre:'Snack Temptations Gato x85g',       animal:'gato',   etapa:'adulto',   cat:'snack',     precio:75,  precioOld:null, marca:'Temptations',   img:IMG+'image18.png', desc:'Crujientes por fuera, suaves por dentro. Irresistibles.', badge:null },
  { id:19, nombre:'Antipulgas Gato Spot-On',           animal:'gato',   etapa:'adulto',   cat:'salud',     precio:160, precioOld:180,  marca:'Frontline',     img:IMG+'image19.png', desc:'Protección mensual contra pulgas y garrapatas.', badge:'oferta' },
  { id:20, nombre:"Hill's Science Diet Gato 7+ 1.5kg", animal:'gato',   etapa:'senior',   cat:'alimento',  precio:390, precioOld:null, marca:"Hill's",        img:IMG+'image20.png', desc:'Fórmula para gatos mayores. Cuida riñones y articulaciones.', badge:null },
  { id:21, nombre:'Alimento Conejo Adulto 1.5kg',      animal:'conejo', etapa:'adulto',   cat:'alimento',  precio:150, precioOld:null, marca:'Versele-Laga',  img:IMG+'image21.png', desc:'Mezcla de heno, verduras y cereales. Sin colorantes.', badge:null },
  { id:22, nombre:'Jaula Conejo Mediana',               animal:'conejo', etapa:'adulto',   cat:'accesorio', precio:520, precioOld:600,  marca:'Ferplast',      img:IMG+'image22.png', desc:'Jaula con bandeja extraíble y comedero incluido.', badge:'oferta' },
  { id:23, nombre:'Snack Heno Timothy Conejo',         animal:'conejo', etapa:'adulto',   cat:'snack',     precio:90,  precioOld:null, marca:'Oxbow',         img:IMG+'image23.png', desc:'Heno de primera calidad. Esencial para la digestión.', badge:'nuevo' },
  { id:24, nombre:'Alimento Periquito Mezcla 1kg',     animal:'ave',    etapa:'adulto',   cat:'alimento',  precio:95,  precioOld:null, marca:'Versele-Laga',  img:IMG+'image24.png', desc:'Mezcla de semillas seleccionadas para periquitos.', badge:null },
  { id:25, nombre:'Jaula Canario Decorativa',          animal:'ave',    etapa:'adulto',   cat:'accesorio', precio:380, precioOld:420,  marca:'Ferplast',      img:IMG+'image25.png', desc:'Diseño elegante con comederos y bebederos incluidos.', badge:'oferta' },
  { id:26, nombre:'Vitaminas Aves Líquidas 30ml',      animal:'ave',    etapa:'adulto',   cat:'salud',     precio:110, precioOld:null, marca:'Nekton',        img:IMG+'image26.png', desc:'Complejo vitamínico para aves en época de muda.', badge:null },
];

// ===== ESTADO =====
let carrito = JSON.parse(localStorage.getItem('macott_carrito') || '[]');
let filtros = { animal:'todos', cat:'todos', etapa:'todos', precio:1000, busqueda:'' };

// ===== UTILIDADES =====
const $ = id => document.getElementById(id);

function guardarCarrito() {
  localStorage.setItem('macott_carrito', JSON.stringify(carrito));
}

function mostrarToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== RENDER PRODUCTOS =====
function renderProductos() {
  const grid  = $('productosGrid');
  const noRes = $('noResults');
  const q     = filtros.busqueda.toLowerCase();

  const filtrados = PRODUCTOS.filter(p => {
    if (filtros.animal !== 'todos' && p.animal !== filtros.animal) return false;
    if (filtros.cat    !== 'todos' && p.cat    !== filtros.cat)    return false;
    if (filtros.etapa  !== 'todos' && p.etapa  !== filtros.etapa)  return false;
    if (p.precio > filtros.precio) return false;
    if (q && !p.nombre.toLowerCase().includes(q) && !p.marca.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q)) return false;
    return true;
  });

  $('resultCount').textContent = filtrados.length
    ? filtrados.length + ' producto' + (filtrados.length !== 1 ? 's' : '')
    : '';

  if (!filtrados.length) {
    grid.innerHTML = '';
    noRes.style.display = 'block';
    return;
  }
  noRes.style.display = 'none';

  grid.innerHTML = filtrados.map(p => {
    const enCarrito = carrito.find(c => c.id === p.id);
    const stock     = getStock(p.id);
    const agotado   = stock === 0;
    const badgeHtml = agotado
      ? '<span class="producto-badge agotado">agotado</span>'
      : (p.badge ? '<span class="producto-badge ' + p.badge + '">' + p.badge + '</span>' : '');
    const oldHtml = p.precioOld ? '<span class="producto-precio-old">$' + p.precioOld + '</span>' : '';
    const btnClass = agotado ? 'btn-add agotado' : (enCarrito ? 'btn-add added' : 'btn-add');
    const btnText  = agotado ? '✕ Agotado' : (enCarrito ? '✓ Agregado' : '+ Agregar');
    const btnExtra = agotado ? 'disabled aria-disabled="true"' : '';
    return '<article class="producto-card' + (agotado ? ' producto-agotado' : '') + '" role="listitem">'
      + '<div class="producto-img">'
      + '<img src="' + p.img + '" alt="' + p.nombre + '" class="prod-img-real" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
      + '<span class="prod-img-fallback" style="display:none;font-size:2.5rem;align-items:center;justify-content:center;height:100%">🐾</span>'
      + badgeHtml
      + '</div>'
      + '<div class="producto-body">'
      + '<div class="producto-tags">'
      + '<span class="tag tag-animal">' + p.animal + '</span>'
      + '<span class="tag tag-etapa">' + p.etapa + '</span>'
      + '<span class="tag tag-cat">' + p.cat + '</span>'
      + '</div>'
      + '<p class="producto-nombre">' + p.nombre + '</p>'
      + '<p class="producto-desc">' + p.desc + '</p>'
      + '<p class="producto-marca">' + p.marca + '</p>'
      + '</div>'
      + '<div class="producto-footer">'
      + '<div><div class="producto-precio">$' + p.precio + ' MXN</div>' + oldHtml + '</div>'
      + '<button class="' + btnClass + '" data-id="' + p.id + '" ' + btnExtra + '>' + btnText + '</button>'
      + '</div></article>';
  }).join('');

  grid.querySelectorAll('.btn-add:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => agregarAlCarrito(Number(btn.dataset.id)));
  });
}

// ===== CARRITO =====
function agregarAlCarrito(id) {
  const prod = PRODUCTOS.find(p => p.id === id);
  if (!prod) return;
  // Verificar stock antes de agregar
  const stock = getStock(id);
  const enCarrito = carrito.find(c => c.id === id);
  const cantActual = enCarrito ? enCarrito.qty : 0;
  if (stock !== 99 && cantActual >= stock) {
    mostrarToast('⚠️ No hay más stock disponible');
    return;
  }
  if (enCarrito) {
    enCarrito.qty++;
  } else {
    carrito.push({ id, qty: 1 });
  }
  guardarCarrito();
  actualizarContadorCarrito();
  renderProductos();
  mostrarToast('🛒 ' + prod.nombre + ' agregado');
}

function quitarDelCarrito(id) {
  carrito = carrito.filter(c => c.id !== id);
  guardarCarrito();
  actualizarContadorCarrito();
  renderCarritoPanel();
  renderProductos();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { quitarDelCarrito(id); return; }
  guardarCarrito();
  actualizarContadorCarrito();
  renderCarritoPanel();
}

function actualizarContadorCarrito() {
  const total = carrito.reduce((s, c) => s + c.qty, 0);
  $('carritoCount').textContent = total;
}

function calcularTotal() {
  return carrito.reduce((s, c) => {
    const p = PRODUCTOS.find(x => x.id === c.id);
    return s + (p ? p.precio * c.qty : 0);
  }, 0);
}

function renderCarritoPanel() {
  const body = $('carritoBody');
  if (!carrito.length) {
    body.innerHTML = '<div class="carrito-empty"><span>🛒</span><p>Tu carrito está vacío</p></div>';
    $('carritoSubtotal').textContent = '$0 MXN';
    $('carritoTotal').textContent    = '$0 MXN';
    return;
  }
  body.innerHTML = carrito.map(c => {
    const p = PRODUCTOS.find(x => x.id === c.id);
    if (!p) return '';
    return '<div class="carrito-item">'
      + '<div class="ci-emoji"><img src="' + p.img + '" alt="' + p.nombre + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px" onerror="this.parentElement.textContent=\'🐾\'"></div>'
      + '<div class="ci-info"><h4>' + p.nombre + '</h4><p>' + p.marca + '</p></div>'
      + '<div class="ci-controls">'
      + '<span class="ci-precio">$' + (p.precio * c.qty) + ' MXN</span>'
      + '<div class="ci-qty">'
      + '<button class="qty-btn" data-id="' + p.id + '" data-delta="-1" aria-label="Quitar uno">−</button>'
      + '<span class="qty-num">' + c.qty + '</span>'
      + '<button class="qty-btn" data-id="' + p.id + '" data-delta="1" aria-label="Agregar uno">+</button>'
      + '</div>'
      + '<button class="ci-quitar" data-id="' + p.id + '" aria-label="Eliminar del carrito">🗑</button>'
      + '</div></div>';
  }).join('');

  const total = calcularTotal();
  $('carritoSubtotal').textContent = '$' + total + ' MXN';
  $('carritoTotal').textContent    = '$' + total + ' MXN';

  body.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarCantidad(Number(btn.dataset.id), Number(btn.dataset.delta)));
  });
  body.querySelectorAll('.ci-quitar').forEach(btn => {
    btn.addEventListener('click', () => quitarDelCarrito(Number(btn.dataset.id)));
  });
}

function abrirCarrito() {
  renderCarritoPanel();
  $('carritoPanel').classList.add('open');
  $('carritoOverlay').classList.add('open');
  $('carritoPanel').setAttribute('aria-hidden', 'false');
  $('carritoOverlay').setAttribute('aria-hidden', 'false');
}

function cerrarCarrito() {
  $('carritoPanel').classList.remove('open');
  $('carritoOverlay').classList.remove('open');
  $('carritoPanel').setAttribute('aria-hidden', 'true');
  $('carritoOverlay').setAttribute('aria-hidden', 'true');
}

// ===== CHECKOUT =====
function abrirCheckout() {
  if (!carrito.length) { mostrarToast('⚠️ Tu carrito está vacío'); return; }
  cerrarCarrito();
  const total   = calcularTotal();
  const session = getSession();

  const resumen = carrito.map(c => {
    const p = PRODUCTOS.find(x => x.id === c.id);
    return p ? '<div class="checkout-resumen-item"><span>' + p.nombre + ' x' + c.qty + '</span><span>$' + (p.precio * c.qty) + '</span></div>' : '';
  }).join('');

  // Pre-llenar datos si hay sesión
  const nombrePre = session ? (session.nombre + ' ' + (session.apellido || '')).trim() : '';
  const emailPre  = session ? session.email : '';
  const telPre    = session ? (session.tel || '') : '';

  $('checkoutContent').innerHTML = '<div class="checkout-form">'
    + '<h3>💳 Finalizar compra</h3>'
    + (session ? '<p class="checkout-sesion-info">✅ Comprando como <strong>' + session.nombre + '</strong></p>' : '')
    + '<div class="checkout-resumen"><h4>Resumen</h4>' + resumen
    + '<div class="checkout-total"><span>Total</span><span>$' + total + ' MXN</span></div></div>'
    + '<div class="form-group"><label for="ck-nombre">Nombre completo</label>'
    + '<input id="ck-nombre" type="text" value="' + nombrePre + '" placeholder="Tu nombre" autocomplete="name" required/></div>'
    + '<div class="form-group"><label for="ck-email">Correo electrónico</label>'
    + '<input id="ck-email" type="email" value="' + emailPre + '" placeholder="correo@ejemplo.com" autocomplete="email" required/></div>'
    + '<div class="form-group"><label for="ck-tel">Teléfono</label>'
    + '<input id="ck-tel" type="tel" value="' + telPre + '" placeholder="55 1234 5678" autocomplete="tel"/></div>'
    + '<div class="form-group"><label for="ck-dir">Dirección de entrega</label>'
    + '<input id="ck-dir" type="text" placeholder="Calle, número, colonia" autocomplete="street-address"/></div>'
    + '<div class="form-row-2">'
    + '<div class="form-group"><label for="ck-ciudad">Ciudad</label>'
    + '<input id="ck-ciudad" type="text" placeholder="Ciudad" autocomplete="address-level2"/></div>'
    + '<div class="form-group"><label for="ck-cp">Código postal</label>'
    + '<input id="ck-cp" type="text" placeholder="00000" autocomplete="postal-code"/></div>'
    + '</div>'
    + '<button class="btn-pagar" id="btnPagar">✅ Confirmar pedido — $' + total + ' MXN</button>'
    + '</div>';

  $('checkoutOverlay').classList.add('open');
  $('checkoutOverlay').setAttribute('aria-hidden', 'false');
  $('btnPagar').addEventListener('click', confirmarPedido);
}

async function confirmarPedido() {
  const nombre = $('ck-nombre').value.trim();
  const email  = $('ck-email').value.trim();
  if (!nombre || !email) { mostrarToast('⚠️ Completa nombre y correo'); return; }

  const btn = $('btnPagar');
  btn.disabled = true;
  btn.textContent = '⏳ Procesando...';

  // Guardar pedido en Firebase si hay sesión activa
  const session = getSession();
  if (session) {
    try {
      const userData = await obtenerUsuario(session.email);
      if (userData) {
        const pedidos = userData.pedidos || [];
        pedidos.push({
          id:     Date.now().toString(),
          fecha:  new Date().toLocaleDateString('es-MX'),
          items:  carrito.map(c => {
            const p = PRODUCTOS.find(x => x.id === c.id);
            return { id: c.id, nombre: p ? p.nombre : '', precio: p ? p.precio : 0, qty: c.qty, cat: p ? p.cat : '' };
          }),
          total:  calcularTotal(),
          dir:    ($('ck-dir') ? $('ck-dir').value.trim() : '') || 'No especificada'
        });
        await actualizarUsuario(session.email, { pedidos });
      }
    } catch(e) {
      console.warn('No se pudo guardar el pedido en Firebase:', e);
    }
  }

  $('checkoutContent').innerHTML = '<div class="checkout-success">'
    + '<span>🎉</span>'
    + '<h3>¡Pedido confirmado!</h3>'
    + '<p>Gracias <strong>' + nombre + '</strong>, recibirás tu pedido pronto.<br/>'
    + 'Te enviaremos los detalles a <strong>' + email + '</strong>.</p>'
    + (session ? '<p style="font-size:.85rem;color:#2e7d32;margin-top:.5rem">✅ Pedido guardado en tu cuenta</p>' : '')
    + '<button class="btn-pagar" id="btnCerrarExito">Volver a la tienda</button>'
    + '</div>';

  carrito = [];
  guardarCarrito();
  actualizarContadorCarrito();
  renderProductos();

  $('btnCerrarExito').addEventListener('click', cerrarCheckout);
}

function cerrarCheckout() {
  $('checkoutOverlay').classList.remove('open');
  $('checkoutOverlay').setAttribute('aria-hidden', 'true');
}

// ===== FILTROS =====
function initFiltros() {
  document.querySelectorAll('input[name="animal"]').forEach(r =>
    r.addEventListener('change', () => { filtros.animal = r.value; renderProductos(); }));
  document.querySelectorAll('input[name="cat"]').forEach(r =>
    r.addEventListener('change', () => { filtros.cat = r.value; renderProductos(); }));
  document.querySelectorAll('input[name="etapa"]').forEach(r =>
    r.addEventListener('change', () => { filtros.etapa = r.value; renderProductos(); }));

  const slider = $('precioMax');
  slider.addEventListener('input', () => {
    filtros.precio = Number(slider.value);
    $('precioLabel').textContent = '$' + slider.value;
    renderProductos();
  });

  $('searchInput').addEventListener('input', e => {
    filtros.busqueda = e.target.value;
    renderProductos();
  });

  $('btnLimpiar').addEventListener('click', () => {
    filtros = { animal:'todos', cat:'todos', etapa:'todos', precio:1000, busqueda:'' };
    slider.value = 1000;
    $('precioLabel').textContent = '$1000';
    $('searchInput').value = '';
    document.querySelectorAll('input[name="animal"]').forEach(r => r.checked = r.value === 'todos');
    document.querySelectorAll('input[name="cat"]').forEach(r =>   r.checked = r.value === 'todos');
    document.querySelectorAll('input[name="etapa"]').forEach(r =>  r.checked = r.value === 'todos');
    renderProductos();
  });
}

// ===== MENÚ MÓVIL =====
function initMenuMovil() {
  const btn  = $('tMenuBtn');
  const menu = $('tMobileMenu');
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
  });
}

// ===== SESIÓN — actualizar header =====
function initSesion() {
  const session = getSession();
  const loginBtn = document.querySelector('.btn-login-header');
  if (session && loginBtn) {
    loginBtn.textContent = '👤 ' + session.nombre;
    loginBtn.href = 'dashboard.html';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const panel   = document.getElementById('carritoPanel');
  const overlay = document.getElementById('carritoOverlay');
  if (panel)   document.body.appendChild(panel);
  if (overlay) document.body.appendChild(overlay);

  initFiltros();
  initMenuMovil();
  initSesion();
  renderProductos();
  actualizarContadorCarrito();

  $('btnCarrito').addEventListener('click', abrirCarrito);
  $('carritoClose').addEventListener('click', cerrarCarrito);
  $('carritoOverlay').addEventListener('click', cerrarCarrito);
  $('btnVaciar').addEventListener('click', () => {
    carrito = [];
    guardarCarrito();
    actualizarContadorCarrito();
    renderCarritoPanel();
    renderProductos();
    mostrarToast('🗑 Carrito vaciado');
  });
  $('btnCheckout').addEventListener('click', abrirCheckout);
  $('checkoutClose').addEventListener('click', cerrarCheckout);
  $('checkoutOverlay').addEventListener('click', e => {
    if (e.target === $('checkoutOverlay')) cerrarCheckout();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { cerrarCarrito(); cerrarCheckout(); }
  });
});
