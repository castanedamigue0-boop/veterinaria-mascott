// ===== CREDENCIALES =====
var ADMIN_USER = 'admin';
var ADMIN_PASS = 'mascott2026';

// ===== FIREBASE =====
import { obtenerTodosUsuarios, actualizarUsuario } from './firebase.js';

async function cargarDatosFirebase() {
  try {
    const users = await obtenerTodosUsuarios();
    // Guardar en memoria para uso del panel
    window._fbUsers = users;
  } catch(e) {
    window._fbUsers = [];
  }
}

// ===== STORAGE (sesion admin local) =====
var Storage = {
  getUsers:   function() { return JSON.parse(localStorage.getItem('macott_users') || '[]'); },
  saveUsers:  function(u) { localStorage.setItem('macott_users', JSON.stringify(u)); },
  isAdmin:    function() { return localStorage.getItem('macott_admin') === 'true'; },
  setAdmin:   function() { localStorage.setItem('macott_admin', 'true'); },
  clearAdmin: function() { localStorage.removeItem('macott_admin'); },
  addNotif:   function(email, msg) {
    var key    = 'macott_notif_' + email;
    var notifs = JSON.parse(localStorage.getItem(key) || '[]');
    notifs.unshift({ msg: msg, fecha: new Date().toLocaleString('es-MX'), leida: false });
    localStorage.setItem(key, JSON.stringify(notifs));
  }
};

// ===== ELEMENTOS =====
var loginWrap  = document.getElementById('adminLoginWrap');
var adminPanel = document.getElementById('adminPanel');

// Si ya estaba logueado
if (Storage.isAdmin()) {
  cargarDatosFirebase().then(() => mostrarPanel());
}

// ===== LOGIN =====
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var user = document.getElementById('a-user').value.trim();
  var pass = document.getElementById('a-pass').value;
  var msg  = document.getElementById('admin-login-msg');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    Storage.setAdmin();
    msg.className   = 'form-msg success';
    msg.textContent = '✅ Acceso concedido...';
    setTimeout(function() { mostrarPanel(); }, 600);
  } else {
    msg.className   = 'form-msg error';
    msg.textContent = '❌ Usuario o contraseña incorrectos.';
  }
});

function mostrarPanel() {
  loginWrap.style.display  = 'none';
  adminPanel.style.display = 'flex';
  cargarDatosFirebase().then(() => {
    initNav();
    renderDashboard();
  });
}

// Toggle pass
var toggleBtn = document.querySelector('.toggle-pass');
if (toggleBtn) {
  toggleBtn.addEventListener('click', function() {
    var inp  = document.getElementById('a-pass');
    var show = inp.type === 'password';
    inp.type         = show ? 'text' : 'password';
    this.textContent = show ? '🙈' : '👁';
  });
}

// Logout
function doLogout() { Storage.clearAdmin(); window.location.href = 'index.html'; }
document.getElementById('btnAdminLogout').addEventListener('click', doLogout);
document.getElementById('btnAdminLogoutTop').addEventListener('click', doLogout);

// Menú móvil
document.getElementById('adminMenuBtn').addEventListener('click', function() {
  document.getElementById('adminSidebar').classList.toggle('open');
  document.getElementById('adminOverlay').classList.toggle('active');
});
document.getElementById('adminOverlay').addEventListener('click', function() {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('adminOverlay').classList.remove('active');
});

// ===== NAVEGACIÓN =====
function initNav() {
  document.querySelectorAll('.as-link[data-section]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.as-link').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.admin-section').forEach(function(s) {
        s.classList.remove('active');
        s.hidden = true;
      });
      var sec = document.getElementById('sec-' + btn.dataset.section);
      if (sec) { sec.classList.add('active'); sec.hidden = false; }
      var fn = { dashboard: renderDashboard, citas: renderCitas, clientes: renderClientes, inventario: renderInventario, ventas: renderVentas };
      if (fn[btn.dataset.section]) fn[btn.dataset.section]();
    });
  });
}

// ===== HELPERS =====
function getUsers() {
  return window._fbUsers || [];
}

function todasLasCitas() {
  var result = [];
  getUsers().forEach(function(u) {
    (u.citas || []).forEach(function(c) {
      result.push({
        id:        c.id,
        mascota:   c.mascota,
        servicio:  c.servicio,
        fecha:     c.fecha,
        hora:      c.hora,
        notas:     c.notas || '',
        estado:    c.estado || 'pendiente',
        userEmail: u.email,
        userName:  (u.nombre || '') + ' ' + (u.apellido || '')
      });
    });
  });
  return result;
}

function cambiarEstado(userEmail, citaId, nuevoEstado) {
  var users = getUsers();
  var user  = users.find(function(u) { return u.email === userEmail; });
  if (!user) return;
  (user.citas || []).forEach(function(c) {
    if (c.id !== citaId) return;
    c.estado = nuevoEstado;
    var emoji = nuevoEstado === 'confirmada' ? '✅' : '❌';
    Storage.addNotif(userEmail,
      emoji + ' Tu cita de ' + c.servicio + ' para ' + c.mascota +
      ' el ' + c.fecha + ' a las ' + c.hora +
      ' fue ' + nuevoEstado + ' por el veterinario.'
    );
  });
  // Actualizar en Firebase
  actualizarUsuario(userEmail, { citas: user.citas });
}

function toast(msg) {
  var t = document.getElementById('aToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'aToast';
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);' +
      'background:#0d47a1;color:#fff;padding:.75rem 1.5rem;border-radius:50px;font-size:.9rem;' +
      'font-weight:600;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);' +
      'transition:transform .3s,opacity .3s;opacity:0;white-space:nowrap;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(function() {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(80px)';
  }, 3000);
}

// ===== DASHBOARD =====
function renderDashboard() {
  cargarDatosFirebase().then(function() {
    var users = getUsers();
  var citas = todasLasCitas();
  var pend  = citas.filter(function(c) { return c.estado === 'pendiente'; });
  var conf  = citas.filter(function(c) { return c.estado === 'confirmada'; });

  document.getElementById('adminStats').innerHTML =
    stat('📅', citas.length, 'Total citas') +
    stat('⏳', pend.length,  'Pendientes') +
    stat('✅', conf.length,  'Confirmadas') +
    stat('👥', users.length, 'Clientes');

  var dc = document.getElementById('dashCitasPendientes');
  dc.innerHTML = pend.length
    ? pend.slice(0,5).map(citaHtml).join('')
    : '<p class="empty-msg">Sin citas pendientes.</p>';
  bindBtns(dc);

  var du = document.getElementById('dashUltimosClientes');
  du.innerHTML = users.length
    ? users.slice(-5).reverse().map(function(u) {
        return '<div class="cliente-mini">' +
          '<div class="cliente-avatar">' + (u.nombre || 'U')[0].toUpperCase() + '</div>' +
          '<div><p class="cliente-nombre">' + (u.nombre||'') + ' ' + (u.apellido||'') + '</p>' +
          '<p class="cliente-email">' + u.email + '</p></div></div>';
      }).join('')
    : '<p class="empty-msg">Sin clientes aún.</p>';
  }); // fin cargarDatosFirebase
}

function stat(icon, num, label) {
  return '<div class="astat"><span style="font-size:2rem">' + icon + '</span>' +
    '<div><span class="astat-num">' + num + '</span><p>' + label + '</p></div></div>';
}

// ===== CITAS =====
var filtroEstado = 'todas';

function renderCitas() {
  // Recargar datos frescos de Firebase antes de mostrar
  cargarDatosFirebase().then(function() {
    var todas    = todasLasCitas();
  var filtradas = filtroEstado === 'todas' ? todas : todas.filter(function(c) { return c.estado === filtroEstado; });
  var cont     = document.getElementById('adminCitasList');

  document.querySelectorAll('.filtro-btn[data-estado]').forEach(function(btn) {
    btn.onclick = function() {
      document.querySelectorAll('.filtro-btn[data-estado]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      filtroEstado = btn.dataset.estado;
      renderCitas();
    };
  });

  cont.innerHTML = filtradas.length
    ? filtradas.map(citaHtml).join('')
    : '<p class="empty-msg">No hay citas.</p>';
  bindBtns(cont);
  }); // fin cargarDatosFirebase
}

function citaHtml(c) {
  var btns = c.estado === 'pendiente'
    ? '<button class="btn-confirmar" data-id="' + c.id + '" data-email="' + c.userEmail + '">✅ Confirmar</button>' +
      '<button class="btn-cancelar-cita" data-id="' + c.id + '" data-email="' + c.userEmail + '">❌ Cancelar</button>'
    : '';
  return '<div class="cita-admin-item ' + c.estado + '">' +
    '<div class="cita-admin-info">' +
      '<h4>' + c.servicio + '</h4>' +
      '<p>🐾 ' + c.mascota + ' &nbsp;|&nbsp; 👤 ' + c.userName.trim() + '</p>' +
      '<p>📅 ' + c.fecha + ' &nbsp;·&nbsp; 🕐 ' + c.hora + '</p>' +
      (c.notas ? '<p>📝 ' + c.notas + '</p>' : '') +
    '</div>' +
    '<div class="cita-admin-actions">' +
      '<span class="badge-estado badge-' + c.estado + '">' + c.estado + '</span>' +
      btns +
    '</div></div>';
}

function bindBtns(cont) {
  cont.querySelectorAll('.btn-confirmar').forEach(function(btn) {
    btn.onclick = function() {
      cambiarEstado(btn.dataset.email, btn.dataset.id, 'confirmada');
      renderCitas(); renderDashboard();
      toast('✅ Cita confirmada — notificación enviada');
    };
  });
  cont.querySelectorAll('.btn-cancelar-cita').forEach(function(btn) {
    btn.onclick = function() {
      cambiarEstado(btn.dataset.email, btn.dataset.id, 'cancelada');
      renderCitas(); renderDashboard();
      toast('❌ Cita cancelada — notificación enviada');
    };
  });
}

// ===== CLIENTES =====
function renderClientes() {
  var users = getUsers();
  var cont  = document.getElementById('clientesList');
  var inp   = document.getElementById('clienteSearch');
  var q     = inp ? inp.value.toLowerCase() : '';
  var lista = q ? users.filter(function(u) {
    return (u.nombre + ' ' + u.apellido + ' ' + u.email).toLowerCase().includes(q);
  }) : users;

  cont.innerHTML = lista.length ? lista.map(function(u) {
    return '<div class="cliente-card">' +
      '<div style="display:flex;align-items:center;gap:.85rem;margin-bottom:.75rem">' +
        '<div class="cliente-avatar">' + (u.nombre||'U')[0].toUpperCase() + '</div>' +
        '<div><h4>' + (u.nombre||'') + ' ' + (u.apellido||'') + '</h4>' +
        '<p>' + u.email + '</p>' +
        '<p>' + (u.tel || 'Sin teléfono') + '</p></div>' +
      '</div>' +
      '<p>🐾 ' + (u.mascotas||[]).length + ' mascotas &nbsp;|&nbsp; 📅 ' + (u.citas||[]).length + ' citas</p>' +
    '</div>';
  }).join('') : '<p class="empty-msg">Sin clientes.</p>';

  if (inp) inp.oninput = renderClientes;
}

// ===== INVENTARIO =====
var INV_KEY = 'mascott_inventario';

var INV_DEFAULTS = [
  { id:1,  nombre:'Royal Canin Cachorro 3kg',       animal:'perro',  cat:'alimento',  marca:'Royal Canin', precio:420, badge:'oferta', desc:'Fórmula especial para cachorros.', cantidad:20 },
  { id:2,  nombre:'Purina Pro Plan Cachorro 4kg',   animal:'perro',  cat:'alimento',  marca:'Purina',      precio:390, badge:'nuevo',  desc:'Proteína de pollo real.',           cantidad:15 },
  { id:3,  nombre:'Collar Ajustable Cachorro',      animal:'perro',  cat:'accesorio', marca:'PetStyle',    precio:85,  badge:null,     desc:'Nylon suave ajustable.',            cantidad:30 },
  { id:4,  nombre:"Hill's Science Diet Adulto 7kg", animal:'perro',  cat:'alimento',  marca:"Hill's",      precio:650, badge:'oferta', desc:'Nutrición balanceada adultos.',     cantidad:10 },
  { id:5,  nombre:'Juguete Kong Classic M',         animal:'perro',  cat:'juguete',   marca:'Kong',        precio:210, badge:'nuevo',  desc:'Caucho natural resistente.',        cantidad:25 },
  { id:6,  nombre:'Antipulgas Spot-On Perro',       animal:'perro',  cat:'salud',     marca:'Frontline',   precio:180, badge:'oferta', desc:'Protección 30 días.',               cantidad:40 },
  { id:7,  nombre:'Cama Ortopédica Perro M',        animal:'perro',  cat:'accesorio', marca:'PetComfort',  precio:450, badge:null,     desc:'Espuma viscoelástica.',             cantidad:8  },
  { id:8,  nombre:'Royal Canin Kitten 2kg',         animal:'gato',   cat:'alimento',  marca:'Royal Canin', precio:350, badge:'oferta', desc:'Para gatitos hasta 12 meses.',      cantidad:18 },
  { id:9,  nombre:'Rascador Torre Gato',            animal:'gato',   cat:'accesorio', marca:'Catit',       precio:320, badge:'nuevo',  desc:'Sisal natural.',                    cantidad:12 },
  { id:10, nombre:'Arena Sanitaria 5kg',            animal:'gato',   cat:'higiene',   marca:'Ever Clean',  precio:130, badge:'oferta', desc:'Control de olores 7 días.',         cantidad:35 },
];

function getInventario() {
  var g = localStorage.getItem(INV_KEY);
  if (g) return JSON.parse(g);
  localStorage.setItem(INV_KEY, JSON.stringify(INV_DEFAULTS));
  return JSON.parse(JSON.stringify(INV_DEFAULTS));
}
function saveInventario(inv) { localStorage.setItem(INV_KEY, JSON.stringify(inv)); }

// Descuenta stock cuando se confirma un pedido
function descontarStock(items) {
  var inv = getInventario();
  (items || []).forEach(function(item) {
    var prod = inv.find(function(p) { return p.id === item.id || p.nombre === item.nombre; });
    if (prod) prod.cantidad = Math.max(0, (prod.cantidad || 0) - (item.qty || 1));
  });
  saveInventario(inv);
}

var filtroInvCat = 'todos';

function renderInventario() {
  var inv = getInventario();

  // Filtros por categoría
  var cats = ['todos','alimento','accesorio','higiene','salud','juguete','snack'];
  var filtrosHtml = cats.map(function(c) {
    return '<button class="filtro-btn' + (filtroInvCat === c ? ' active' : '') + '" data-invcat="' + c + '">' +
      (c === 'todos' ? 'Todos' : c.charAt(0).toUpperCase() + c.slice(1)) + '</button>';
  }).join('');

  var filtrados = filtroInvCat === 'todos' ? inv : inv.filter(function(p) { return p.cat === filtroInvCat; });

  // Stats por categoría
  var totalStock = inv.reduce(function(a, p) { return a + (p.cantidad || 0); }, 0);
  var stockBajo  = inv.filter(function(p) { return (p.cantidad || 0) <= 5; }).length;
  var valorTotal = inv.reduce(function(a, p) { return a + (p.precio * (p.cantidad || 0)); }, 0);

  var statsHtml =
    stat('�', inv.length,   'Productos') +
    stat('🔢', totalStock,   'Unidades totales') +
    stat('⚠️', stockBajo,    'Stock bajo (≤5)') +
    stat('💵', '$' + valorTotal.toLocaleString(), 'Valor inventario');

  document.getElementById('adminStats').innerHTML = statsHtml;

  var tbody = document.getElementById('adminInvBody');
  var count = document.getElementById('invCount');

  // Cabecera con filtros
  var filtrosCont = document.getElementById('invFiltrosCont');
  if (filtrosCont) filtrosCont.innerHTML = filtrosHtml;

  tbody.innerHTML = filtrados.map(function(p) {
    var stockClass = (p.cantidad || 0) <= 0 ? 'color:#c62828;font-weight:800' :
                     (p.cantidad || 0) <= 5  ? 'color:#e65100;font-weight:700' : '';
    return '<tr>' +
      '<td>' + p.id + '</td>' +
      '<td><strong>' + p.nombre + '</strong><br><small style="color:#546e7a">' + p.desc + '</small></td>' +
      '<td>' + p.animal + '</td>' +
      '<td><span class="inv-badge ' + (p.cat) + '" style="background:#e3f2fd;color:#0d47a1">' + p.cat + '</span></td>' +
      '<td>' + p.marca + '</td>' +
      '<td>$' + p.precio + '</td>' +
      '<td style="' + stockClass + '">' + (p.cantidad || 0) + ' uds</td>' +
      '<td>' + (p.badge ? '<span class="inv-badge ' + p.badge + '">' + p.badge + '</span>' : '-') + '</td>' +
      '<td style="display:flex;gap:.4rem;flex-wrap:wrap">' +
        '<button class="btn-inv-mas"  data-id="' + p.id + '" title="Agregar stock">+</button>' +
        '<button class="btn-inv-menos" data-id="' + p.id + '" title="Quitar stock">-</button>' +
        '<button class="btn-eliminar-prod" data-id="' + p.id + '">🗑</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  if (count) count.textContent = filtrados.length + ' de ' + inv.length + ' productos · Stock total: ' + totalStock + ' uds';

  // Bind filtros categoría
  document.querySelectorAll('[data-invcat]').forEach(function(btn) {
    btn.onclick = function() { filtroInvCat = btn.dataset.invcat; renderInventario(); };
  });

  // Bind +/-
  tbody.querySelectorAll('.btn-inv-mas').forEach(function(btn) {
    btn.onclick = function() {
      var inv2 = getInventario();
      var p = inv2.find(function(x) { return x.id === parseInt(btn.dataset.id); });
      if (p) { p.cantidad = (p.cantidad || 0) + 1; saveInventario(inv2); renderInventario(); }
    };
  });
  tbody.querySelectorAll('.btn-inv-menos').forEach(function(btn) {
    btn.onclick = function() {
      var inv2 = getInventario();
      var p = inv2.find(function(x) { return x.id === parseInt(btn.dataset.id); });
      if (p && p.cantidad > 0) { p.cantidad--; saveInventario(inv2); renderInventario(); }
    };
  });
  tbody.querySelectorAll('.btn-eliminar-prod').forEach(function(btn) {
    btn.onclick = function() {
      if (!confirm('¿Eliminar este producto?')) return;
      saveInventario(getInventario().filter(function(p) { return p.id !== parseInt(btn.dataset.id); }));
      renderInventario(); toast('🗑 Producto eliminado');
    };
  });

  // Form agregar
  var btnAgregar = document.getElementById('btnAgregarProducto');
  if (btnAgregar) btnAgregar.onclick = function() {
    var wrap = document.getElementById('formProductoWrap');
    wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  };
  var btnCancelar = document.getElementById('btnCancelarProducto');
  if (btnCancelar) btnCancelar.onclick = function() {
    document.getElementById('formProductoWrap').style.display = 'none';
    document.getElementById('formProducto').reset();
  };
  var formProd = document.getElementById('formProducto');
  if (formProd) formProd.onsubmit = function(e) {
    e.preventDefault();
    var nombre   = document.getElementById('p-nombre').value.trim();
    var precio   = parseFloat(document.getElementById('p-precio').value);
    var cantidad = parseInt(document.getElementById('p-cantidad').value) || 0;
    var msgEl    = document.getElementById('prod-msg');
    if (!nombre) { document.getElementById('pe-nombre').textContent = 'Ingresa el nombre.'; return; }
    if (!precio) { document.getElementById('pe-precio').textContent = 'Ingresa el precio.'; return; }
    var inv3    = getInventario();
    var nuevoId = inv3.length ? Math.max.apply(null, inv3.map(function(p) { return p.id; })) + 1 : 1;
    inv3.push({
      id: nuevoId, nombre: nombre,
      marca:    document.getElementById('p-marca').value.trim() || '-',
      precio:   precio, cantidad: cantidad,
      animal:   document.getElementById('p-animal').value || 'todos',
      cat:      document.getElementById('p-cat').value    || 'accesorio',
      badge:    document.getElementById('p-badge').value  || null,
      desc:     document.getElementById('p-desc').value.trim()
    });
    saveInventario(inv3);
    msgEl.className = 'form-msg success'; msgEl.textContent = '✅ Producto agregado.';
    setTimeout(function() {
      document.getElementById('formProductoWrap').style.display = 'none';
      document.getElementById('formProducto').reset();
      msgEl.textContent = ''; msgEl.className = 'form-msg';
      renderInventario();
    }, 900);
  };
}

// ===== VENTAS =====
function renderVentas() {
  var users = getUsers();
  var pedidos = [];
  var totalIngresos = 0;
  var totalUnidades = 0;
  var ventasPorCat  = {};

  users.forEach(function(u) {
    (u.pedidos || []).forEach(function(p) {
      pedidos.push({ p: p, nombre: (u.nombre||'') + ' ' + (u.apellido||''), email: u.email });
      totalIngresos += p.total || 0;
      (p.items || []).forEach(function(i) {
        totalUnidades += i.qty || 1;
        var cat = i.cat || 'otro';
        ventasPorCat[cat] = (ventasPorCat[cat] || 0) + (i.qty || 1);
      });
    });
  });

  document.getElementById('ventasStats').innerHTML =
    stat('🧾', pedidos.length,                     'Pedidos totales') +
    stat('📦', totalUnidades,                       'Unidades vendidas') +
    stat('💰', '$' + totalIngresos.toLocaleString(), 'Ingresos totales') +
    stat('👥', users.length,                        'Clientes registrados');

  var topCats = Object.keys(ventasPorCat).sort(function(a,b){ return ventasPorCat[b]-ventasPorCat[a]; });
  var topEl = document.getElementById('ventasTopCats');
  if (topEl) {
    topEl.innerHTML = topCats.length
      ? '<div style="margin-bottom:1.5rem"><h3 style="color:#b71c1c;margin-bottom:.75rem">📊 Ventas por categoría</h3>' +
        '<div style="display:flex;flex-wrap:wrap;gap:.5rem">' +
        topCats.map(function(c) {
          return '<span style="background:#ffebee;color:#b71c1c;padding:.35rem .85rem;border-radius:20px;font-size:.85rem;font-weight:700">' +
            c + ': ' + ventasPorCat[c] + ' uds</span>';
        }).join('') + '</div></div>'
      : '';
  }

  var tbody = document.getElementById('ventasBody');
  var count = document.getElementById('ventasCount');

  tbody.innerHTML = pedidos.length
    ? pedidos.map(function(entry) {
        var p = entry.p;
        var items = (p.items||[]).map(function(i){ return i.nombre + ' x' + i.qty; }).join(', ');
        return '<tr>' +
          '<td><strong>#' + (p.id||'').slice(-4) + '</strong></td>' +
          '<td>' + entry.nombre.trim() + '<br><small>' + entry.email + '</small></td>' +
          '<td>' + (p.fecha||'-') + '</td>' +
          '<td style="font-size:.8rem;max-width:220px;color:#546e7a">' + items + '</td>' +
          '<td><strong style="color:#2e7d32">$' + (p.total||0) + '</strong></td>' +
        '</tr>';
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#546e7a">Sin ventas registradas.</td></tr>';

  if (count) count.textContent = pedidos.length + ' pedidos · Ingresos: $' + totalIngresos.toLocaleString() + ' MXN';
}
