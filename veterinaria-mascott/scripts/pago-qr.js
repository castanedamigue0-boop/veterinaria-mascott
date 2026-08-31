import {
  getSession,
  obtenerUsuario,
  actualizarUsuario,
  agregarNotificacion
} from '../scripts/base-de-datos.js';

// ===== SESIÓN =====
const session = getSession();
if (!session) window.location.replace('../paginas/login-registro.html');

// ===== DATOS DEL CARRITO (viene de localStorage) =====
const CARRITO_KEY  = 'macott_carrito_checkout';
const PEDIDO_KEY   = 'macott_pedido_pendiente';

let carrito   = [];
let total     = 0;
let pedidoId  = null;
let timerInt  = null;
let timerSecs = 300; // 5 minutos

// ===== CATÁLOGO (para obtener nombres/emojis) =====
const EMOJIS = {
  alimento: '🦴', snack: '🍗', higiene: '🧴',
  salud: '💊', juguete: '🧸', accesorio: '🎀'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  cargarCarrito();
  if (!carrito.length) {
    window.location.replace('../paginas/tienda-productos.html');
    return;
  }
  renderResumen();
  generarQR();
  iniciarTimer();

  document.getElementById('btnSimularPago').addEventListener('click', simularEscaneo);
});

// ===== CARGAR CARRITO =====
function cargarCarrito() {
  // Intentar desde checkout key, luego desde carrito normal
  var data = localStorage.getItem(CARRITO_KEY) || localStorage.getItem('macott_carrito');
  try {
    carrito = JSON.parse(data || '[]');
  } catch(e) {
    carrito = [];
  }
  total = carrito.reduce(function(s, i) {
    return s + (parseFloat(i.precio) * (i.qty || 1));
  }, 0);
}

// ===== RENDER RESUMEN =====
function renderResumen() {
  var container = document.getElementById('pedidoItems');
  var subtotalEl = document.getElementById('pedidoSubtotal');
  var totalEl    = document.getElementById('pedidoTotal');
  var montoEl    = document.getElementById('qrMonto');

  if (!carrito.length) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">Carrito vacío</p>';
    return;
  }

  container.innerHTML = carrito.map(function(item) {
    var emoji = item.emoji || '📦';
    var sub   = parseFloat(item.precio) * (item.qty || 1);
    return '<div class="pedido-item">' +
      '<span class="pedido-item-emoji">' + emoji + '</span>' +
      '<div class="pedido-item-info">' +
        '<p class="pedido-item-nombre">' + item.nombre + '</p>' +
        '<p class="pedido-item-marca">' + (item.marca || '') + '</p>' +
      '</div>' +
      '<span class="pedido-item-qty">x' + (item.qty || 1) + '</span>' +
      '<span class="pedido-item-precio">$' + sub.toLocaleString() + '</span>' +
    '</div>';
  }).join('');

  if (subtotalEl) subtotalEl.textContent = '$' + total.toLocaleString();
  if (totalEl)    totalEl.textContent    = '$' + total.toLocaleString();
  if (montoEl)    montoEl.textContent    = 'Total: $' + total.toLocaleString() + ' COP';
}

// ===== GENERAR QR =====
function generarQR() {
  var qrData = JSON.stringify({
    negocio:  'Veterinaria Mascott',
    cuenta:   '3114569768',
    monto:    total,
    moneda:   'COP',
    ref:      'PED-' + Date.now(),
    cliente:  session.email,
    ts:       new Date().toISOString()
  });

  pedidoId = 'PED-' + Date.now();

  try {
    new QRCode(document.getElementById('qrCode'), {
      text:          qrData,
      width:         180,
      height:        180,
      colorDark:     '#0D5C82',
      colorLight:    '#FFFFFF',
      correctLevel:  QRCode.CorrectLevel.H
    });
  } catch(e) {
    // Fallback si QRCode no carga
    document.getElementById('qrCode').innerHTML =
      '<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;' +
      'background:#e3f2fd;border-radius:8px;font-size:3rem">📱</div>';
  }
}

// ===== TIMER =====
function iniciarTimer() {
  actualizarTimerUI();
  timerInt = setInterval(function() {
    timerSecs--;
    actualizarTimerUI();
    if (timerSecs <= 0) {
      clearInterval(timerInt);
      qrExpirado();
    }
  }, 1000);
}

function actualizarTimerUI() {
  var min  = Math.floor(timerSecs / 60);
  var seg  = timerSecs % 60;
  var txt  = document.getElementById('timerText');
  var circ = document.getElementById('timerCircle');
  if (txt)  txt.textContent = min + ':' + String(seg).padStart(2, '0');
  if (circ) {
    var pct    = timerSecs / 300;
    var circum = 125.6;
    circ.style.strokeDashoffset = circum * (1 - pct);
    circ.style.stroke = timerSecs < 60
      ? 'var(--color-error-600)'
      : timerSecs < 120
        ? 'var(--color-warning-600)'
        : 'var(--color-primary-600)';
  }
}

function qrExpirado() {
  var btn = document.getElementById('btnSimularPago');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏱ QR expirado — recarga la página';
    btn.style.background = '#ccc';
  }
  var label = document.querySelector('.qr-timer-label');
  if (label) { label.textContent = '❌ QR expirado'; label.style.color = 'var(--color-error-600)'; }
}

// ===== SIMULAR ESCANEO =====
async function simularEscaneo() {
  clearInterval(timerInt);

  var btn = document.getElementById('btnSimularPago');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Procesando...'; }

  // Mostrar pantalla "procesando"
  irStep('step-procesando');

  // Simular delay de red (1.5s)
  await esperar(1500);

  // Guardar pedido en Firebase
  try {
    await guardarPedido();
    irStep('step-exito');
    renderExito();
  } catch(e) {
    console.error('Error guardando pedido:', e);
    // Mostrar éxito de todas formas (simulador)
    irStep('step-exito');
    renderExito();
  }
}

// ===== GUARDAR PEDIDO EN FIREBASE =====
async function guardarPedido() {
  var userData = await obtenerUsuario(session.email);
  if (!userData) return;

  var pedido = {
    id:           pedidoId || ('PED-' + Date.now()),
    fecha:        new Date().toLocaleDateString('es-CO'),
    hora:         new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    items:        carrito,
    total:        total,
    estado:       'pagado',           // pago recibido
    estadoSalida: 'pendiente_auth',   // esperando autorización admin
    metodoPago:   'QR / Nequi',
    fechaISO:     new Date().toISOString()
  };

  if (!userData.pedidos) userData.pedidos = [];
  userData.pedidos.push(pedido);

  // Vaciar carrito
  userData.carrito = [];

  await actualizarUsuario(session.email, userData);

  // Notificación al usuario
  await agregarNotificacion(session.email,
    '💰 Pago recibido por $' + total.toLocaleString() +
    ' COP. Tu pedido #' + pedido.id.slice(-4) +
    ' está en espera de autorización por el administrador.'
  );

  // Guardar referencia para mostrar en pantalla éxito
  localStorage.setItem(PEDIDO_KEY, JSON.stringify(pedido));

  // Limpiar carrito del localStorage
  localStorage.removeItem('macott_carrito');
  localStorage.removeItem(CARRITO_KEY);

  // Notificar al admin (guardar en colección de pagos pendientes)
  await notificarAdmin(pedido, userData);
}

// ===== NOTIFICAR AL ADMIN =====
async function notificarAdmin(pedido, userData) {
  try {
    // Obtener todos los usuarios para encontrar al admin
    // El admin tiene su notificación en el campo adminNotificaciones
    // Usamos agregarNotificacion con email admin
    var itemsStr = (pedido.items || [])
      .map(function(i) { return i.nombre + ' x' + (i.qty || 1); })
      .join(', ');

    await agregarNotificacion('admin@mascott.com',
      '💰 NUEVO PAGO RECIBIDO — ' +
      (userData.nombre || '') + ' ' + (userData.apellido || '') +
      ' (' + session.email + ') pagó $' + total.toLocaleString() +
      ' COP por: ' + itemsStr +
      ' | Pedido #' + pedido.id.slice(-4) +
      ' | Autorizar salida en panel Admin > Ventas.'
    );
  } catch(e) {
    console.warn('No se pudo notificar al admin:', e);
  }
}

// ===== RENDER PANTALLA ÉXITO =====
function renderExito() {
  var pedido = null;
  try { pedido = JSON.parse(localStorage.getItem(PEDIDO_KEY) || 'null'); } catch(e) {}

  if (!pedido) return;

  var det = document.getElementById('exitoDetalle');
  if (det) {
    det.innerHTML =
      '<div class="exito-detalle-row">' +
        '<span>Pedido</span><span>#' + pedido.id.slice(-4) + '</span>' +
      '</div>' +
      '<div class="exito-detalle-row">' +
        '<span>Fecha</span><span>' + pedido.fecha + ' · ' + pedido.hora + '</span>' +
      '</div>' +
      '<div class="exito-detalle-row">' +
        '<span>Total pagado</span><span>$' + total.toLocaleString() + ' COP</span>' +
      '</div>' +
      '<div class="exito-detalle-row">' +
        '<span>Método</span><span>' + pedido.metodoPago + '</span>' +
      '</div>';
  }
}

// ===== NAVEGAR ENTRE PASOS =====
function irStep(id) {
  document.querySelectorAll('.pago-step').forEach(function(s) {
    s.classList.remove('active');
    s.hidden = true;
  });
  var target = document.getElementById(id);
  if (target) { target.classList.add('active'); target.hidden = false; }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function esperar(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}
