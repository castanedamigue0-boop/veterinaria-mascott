import {
  crearUsuario, obtenerUsuario, actualizarUsuario,
  setSession, getSession,
  obtenerDoctores, setDoctorSession, getDoctorSession,
  crearDoctor
} from '../scripts/base-de-datos.js';

// ===== DOCTORES POR DEFECTO (se crean si no existen) =====
const DOCTORES_DEFAULT = [
  { id:'doc1', nombre:'Dr. Andrés García',    especialidad:'Medicina General',    email:'andres@mascott.com', tel:'555-0001', exp:'8 años',  horario:'Lun-Vie 8am-4pm',  foto:'', bio:'Médico veterinario con especialidad en pequeñas especies.', clinica:'Clínica Mascott', licencia:'CEDVET-001', password:'doctor1' },
  { id:'doc2', nombre:'Dra. Laura Martínez',  especialidad:'Cirugía Veterinaria', email:'laura@mascott.com',  tel:'555-0002', exp:'12 años', horario:'Lun-Sáb 9am-5pm',  foto:'', bio:'Especialista en cirugía ortopédica y tejidos blandos.',    clinica:'Clínica Mascott', licencia:'CEDVET-002', password:'doctor2' },
  { id:'doc3', nombre:'Dr. Carlos Pérez',     especialidad:'Dermatología',        email:'carlos@mascott.com', tel:'555-0003', exp:'6 años',  horario:'Mar-Sáb 10am-6pm', foto:'', bio:'Experto en enfermedades de piel y alergias en mascotas.',   clinica:'Clínica Mascott', licencia:'CEDVET-003', password:'doctor3' },
  { id:'doc4', nombre:'Dra. Sofia Ramírez',   especialidad:'Nutrición Animal',    email:'sofia@mascott.com',  tel:'555-0004', exp:'5 años',  horario:'Lun-Vie 9am-3pm',   foto:'', bio:'Nutricionista veterinaria con planes personalizados.',       clinica:'Clínica Mascott', licencia:'CEDVET-004', password:'doctor4' },
  { id:'doc5', nombre:'Dr. Miguel Torres',    especialidad:'Urgencias 24h',       email:'miguel@mascott.com', tel:'555-0005', exp:'10 años', horario:'24/7 Urgencias',    foto:'', bio:'Especialista en medicina de urgencias disponible 24/7.',    clinica:'Clínica Mascott', licencia:'CEDVET-005', password:'doctor5' },
];

// Cargar doctores en Firebase si no existen
async function inicializarDoctores() {
  try {
    const docs = await obtenerDoctores();
    if (docs.length === 0) {
      for (const d of DOCTORES_DEFAULT) await crearDoctor(d);
    }
  } catch(e) { console.warn('Error inicializando doctores:', e); }
}

// ===== REDIRIGIR SI YA HAY SESIÓN =====
if (getSession()) window.location.replace('../paginas/panel-usuario.html');
else if (getDoctorSession()) window.location.replace('../paginas/panel-doctor.html');

// ===== PANELES =====
const rolSelector  = document.getElementById('rolSelector');
const panelCliente = document.getElementById('panelCliente');
const panelDoctor  = document.getElementById('panelDoctor');
const panelAdmin   = document.getElementById('panelAdmin');

function mostrarPanel(id) {
  [rolSelector, panelCliente, panelDoctor, panelAdmin].forEach(p => {
    if (!p) return;
    p.classList.remove('active');
    if (p.id !== 'rolSelector') p.hidden = true;
    else p.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (!target) return;
  if (id === 'rolSelector') {
    target.style.display = 'flex';
    target.classList.add('active');
  } else {
    target.hidden = false;
    target.classList.add('active');
  }
}

// Botones de rol
document.getElementById('rolCliente').addEventListener('click', () => mostrarPanel('panelCliente'));
document.getElementById('rolAdmin').addEventListener('click',   () => mostrarPanel('panelAdmin'));
document.getElementById('rolDoctor').addEventListener('click',  async () => {
  mostrarPanel('panelDoctor');
  await cargarDoctoresEnGrid();
});

// Botones volver
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => mostrarPanel(btn.dataset.back));
});

// ===== CARGAR DOCTORES EN GRID =====
async function cargarDoctoresEnGrid() {
  const grid = document.getElementById('doctorGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1rem;color:#546e7a">Cargando doctores...</div>';
  try {
    await inicializarDoctores();
    const docs = await obtenerDoctores();
    if (!docs.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1rem;color:#e53935">No hay doctores registrados.</div>';
      return;
    }
    grid.innerHTML = docs.map(d => `
      <button class="doctor-btn" data-id="${d.id}">
        <div class="doc-avatar">${d.nombre.charAt(0)}</div>
        <div class="doc-info">
          <p>${d.nombre}</p>
          <span>${d.especialidad}</span>
        </div>
      </button>
    `).join('');

    // Al hacer clic mostrar form de contraseña
    grid.querySelectorAll('.doctor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const doc = docs.find(d => d.id === btn.dataset.id);
        if (doc) mostrarPassDoctor(doc);
      });
    });
  } catch(e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:1rem;color:#e53935">Error cargando doctores.</div>';
  }
}

// ===== PEDIR CONTRASEÑA AL DOCTOR SELECCIONADO =====
let _docSeleccionado = null;

function mostrarPassDoctor(doc) {
  _docSeleccionado = doc;
  const grid = document.getElementById('doctorGrid');

  grid.innerHTML = `
    <div style="grid-column:1/-1;animation:fadeSlide .3s ease">
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;
                  padding:.75rem 1rem;background:#f0f7f0;border-radius:12px;
                  border:2px solid #c8e6c9">
        <div class="doc-avatar" style="background:linear-gradient(135deg,#66bb6a,#2e7d32)">
          ${doc.nombre.charAt(0)}
        </div>
        <div>
          <p style="font-weight:700;color:#1b5e20;font-size:.9rem">${doc.nombre}</p>
          <span style="font-size:.75rem;color:#546e7a">${doc.especialidad}</span>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:.75rem">
        <label style="font-size:.85rem;font-weight:600;color:#1b5e20">Contraseña</label>
        <div class="pass-wrap" style="margin-top:.35rem">
          <input type="password" id="docPassInput" placeholder="••••••••"
            autocomplete="current-password"
            style="width:100%;padding:.75rem 3rem .75rem 1rem;border:2px solid #c8e6c9;
                   border-radius:12px;font-size:.95rem;color:#1a1a2e;background:#fff;
                   transition:border-color .2s"/>
          <button type="button" class="toggle-pass" data-target="docPassInput"
            style="position:absolute;right:.75rem;top:50%;transform:translateY(-50%);
                   background:none;border:none;cursor:pointer;font-size:1rem;color:#546e7a">👁</button>
        </div>
      </div>
      <div style="display:flex;gap:.6rem">
        <button id="btnConfirmDocPass" class="btn-auth"
          style="flex:1;background:linear-gradient(135deg,#1b5e20,#2e7d32)">
          <span>🩺</span> Entrar
        </button>
        <button id="btnVolverDoctores" class="btn-auth"
          style="background:#546e7a;flex:0 0 auto;padding:.7rem 1rem">
          ← Volver
        </button>
      </div>
      <div class="form-msg" id="docPassMsg" role="status" aria-live="polite" style="margin-top:.5rem"></div>
    </div>`;

  // Toggle contraseña
  const toggleBtn = grid.querySelector('.toggle-pass');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const inp = document.getElementById('docPassInput');
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      this.textContent = show ? '🙈' : '👁';
    });
  }

  // Enter para confirmar
  const passInput = document.getElementById('docPassInput');
  if (passInput) {
    passInput.focus();
    passInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') verificarPassDoctor();
    });
  }

  document.getElementById('btnConfirmDocPass').addEventListener('click', verificarPassDoctor);
  document.getElementById('btnVolverDoctores').addEventListener('click', () => cargarDoctoresEnGrid());
}

async function verificarPassDoctor() {
  const pass = document.getElementById('docPassInput')?.value || '';
  const msg  = document.getElementById('docPassMsg');
  if (!pass) {
    msg.className = 'form-msg error'; msg.textContent = '❌ Ingresa tu contraseña.'; return;
  }
  if (pass === _docSeleccionado.password) {
    msg.className = 'form-msg success'; msg.textContent = `✅ Bienvenido/a ${_docSeleccionado.nombre}`;
    setDoctorSession(_docSeleccionado);
    setTimeout(() => window.location.href = '../paginas/panel-doctor.html', 700);
  } else {
    msg.className = 'form-msg error'; msg.textContent = '❌ Contraseña incorrecta.';
    const inp = document.getElementById('docPassInput');
    if (inp) { inp.style.borderColor = '#e53935'; inp.value = ''; inp.focus(); }
  }
}

// ===== TABS LOGIN/REGISTRO =====
const tabLogin    = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const panelLogin  = document.getElementById('panel-login');
const panelReg    = document.getElementById('panel-register');

function showTab(tab) {
  const isLogin = tab === 'login';
  if (tabLogin)    tabLogin.classList.toggle('active', isLogin);
  if (tabRegister) tabRegister.classList.toggle('active', !isLogin);
  if (panelLogin)  { panelLogin.classList.toggle('active', isLogin);  panelLogin.hidden  = !isLogin; }
  if (panelReg)    { panelReg.classList.toggle('active', !isLogin);   panelReg.hidden    = isLogin; }
}

if (tabLogin)    tabLogin.addEventListener('click',    () => showTab('login'));
if (tabRegister) tabRegister.addEventListener('click', () => showTab('register'));
const goReg   = document.getElementById('goRegister');
const goLogin = document.getElementById('goLogin');
if (goReg)   goReg.addEventListener('click',   () => showTab('register'));
if (goLogin) goLogin.addEventListener('click', () => showTab('login'));

// ===== TOGGLE CONTRASEÑA =====
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', function() {
    const input = document.getElementById(this.dataset.target);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    this.textContent = show ? '🙈' : '👁';
  });
});

// ===== FUERZA CONTRASEÑA =====
const rPass    = document.getElementById('r-pass');
const strength = document.getElementById('passStrength');
if (rPass && strength) {
  rPass.addEventListener('input', () => {
    const v = rPass.value;
    let level = 0;
    if (v.length >= 6) level++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) level++;
    if (/[^A-Za-z0-9]/.test(v) && v.length >= 8) level++;
    const labels = ['','Débil','Media','Fuerte'];
    const cls    = ['','weak','medium','strong'];
    strength.className = 'pass-strength ' + (cls[level] || '');
    strength.innerHTML = v.length
      ? `<div class="bar"></div><div class="bar"></div><div class="bar"></div><span>${labels[level]||''}</span>`
      : '';
  });
}

// ===== VALIDACIÓN =====
function validate(inputId, errId, check, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (!input) return true;
  if (!check(input.value)) {
    input.classList.add('invalid'); input.classList.remove('valid');
    if (err) err.textContent = msg;
    return false;
  }
  input.classList.remove('invalid'); input.classList.add('valid');
  if (err) err.textContent = '';
  return true;
}

// ===== LOGIN CLIENTE =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('l-email').value.trim();
    const pass  = document.getElementById('l-pass').value;
    const msg   = document.getElementById('login-msg');
    let valid = true;
    valid = validate('l-email','le-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
    valid = validate('l-pass', 'le-pass',  v => v.length >= 6, 'Mínimo 6 caracteres.') && valid;
    if (!valid) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Verificando...';
    try {
      const user = await obtenerUsuario(email);
      if (!user || user.password !== pass) {
        msg.className = 'form-msg error';
        msg.textContent = '❌ Correo o contraseña incorrectos.';
        btn.disabled = false; btn.textContent = 'Entrar';
        return;
      }
      setSession({ nombre: user.nombre, apellido: user.apellido, email: user.email, tel: user.tel });
      msg.className = 'form-msg success';
      msg.textContent = `✅ ¡Bienvenido/a ${user.nombre}!`;
      setTimeout(() => window.location.href = '../paginas/panel-usuario.html', 700);
    } catch(err) {
      msg.className = 'form-msg error';
      msg.textContent = '❌ Error de conexión.';
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
}

// ===== REGISTRO =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre   = document.getElementById('r-nombre').value.trim();
    const apellido = document.getElementById('r-apellido').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const pass     = document.getElementById('r-pass').value;
    const pass2    = document.getElementById('r-pass2').value;
    const tel      = document.getElementById('r-tel').value.trim();
    const msg      = document.getElementById('register-msg');
    let valid = true;
    valid = validate('r-nombre',  're-nombre',  v => v.length >= 2, 'Ingresa tu nombre.') && valid;
    valid = validate('r-apellido','re-apellido',v => v.length >= 2, 'Ingresa tu apellido.') && valid;
    valid = validate('r-email',   're-email',   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
    valid = validate('r-pass',    're-pass',    v => v.length >= 6, 'Mínimo 6 caracteres.') && valid;
    valid = validate('r-pass2',   're-pass2',   v => v === pass, 'Las contraseñas no coinciden.') && valid;
    if (!valid) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Creando cuenta...';
    try {
      const existe = await obtenerUsuario(email);
      if (existe) {
        msg.className = 'form-msg error';
        msg.textContent = '❌ Ya existe una cuenta con ese correo.';
        btn.disabled = false; btn.textContent = 'Crear cuenta';
        return;
      }
      await crearUsuario({ nombre, apellido, email, password: pass, tel, citas:[], mascotas:[], carrito:[], pedidos:[], fechaRegistro: new Date().toISOString() });
      setSession({ nombre, apellido, email, tel });
      msg.className = 'form-msg success';
      msg.textContent = `✅ ¡Cuenta creada! Bienvenido/a ${nombre}...`;
      setTimeout(() => window.location.href = '../paginas/panel-usuario.html', 900);
    } catch(err) {
      msg.className = 'form-msg error';
      msg.textContent = '❌ Error al crear cuenta.';
      btn.disabled = false; btn.textContent = 'Crear cuenta';
    }
  });
}

// ===== LOGIN ADMIN =====
const adminForm = document.getElementById('adminDirectForm');
if (adminForm) {
  adminForm.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('a-user').value.trim();
    const pass = document.getElementById('a-pass-login').value;
    const msg  = document.getElementById('admin-login-msg');
    if (user === 'admin' && pass === 'mascott2026') {
      localStorage.setItem('macott_admin', 'true');
      msg.className = 'form-msg success'; msg.textContent = '✅ Acceso concedido...';
      setTimeout(() => window.location.href = '../paginas/panel-administrador.html', 600);
    } else {
      msg.className = 'form-msg error'; msg.textContent = '❌ Credenciales incorrectas.';
    }
  });
}
