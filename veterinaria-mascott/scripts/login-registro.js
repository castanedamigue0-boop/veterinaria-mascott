import {
  crearUsuario, obtenerUsuario, actualizarUsuario,
  setSession, getSession,
  obtenerDoctores, setDoctorSession, getDoctorSession,
  crearDoctor, actualizarDoctor
} from '../scripts/base-de-datos.js';

// ===== CREDENCIALES ADMIN =====
const ADMIN_EMAIL    = 'admin@mascott.com';
const ADMIN_PASSWORD = 'mascott2026';

// ===== DOCTORES POR DEFECTO =====
const DOCTORES_DEFAULT = [
  { id:'doc1', nombre:'Dr. Andrés García',   especialidad:'Medicina General',    email:'andres@mascott.com', tel:'555-0001', exp:'8 años',  horario:'Lun-Vie 8am-4pm',  foto:'', bio:'Médico veterinario con especialidad en pequeñas especies.',  clinica:'Clínica Mascott', licencia:'CEDVET-001', password:'doctor1' },
  { id:'doc2', nombre:'Dra. Laura Martínez', especialidad:'Cirugía Veterinaria', email:'laura@mascott.com',  tel:'555-0002', exp:'12 años', horario:'Lun-Sáb 9am-5pm',  foto:'', bio:'Especialista en cirugía ortopédica y tejidos blandos.',    clinica:'Clínica Mascott', licencia:'CEDVET-002', password:'doctor2' },
  { id:'doc3', nombre:'Dr. Carlos Pérez',    especialidad:'Dermatología',        email:'carlos@mascott.com', tel:'555-0003', exp:'6 años',  horario:'Mar-Sáb 10am-6pm', foto:'', bio:'Experto en enfermedades de piel y alergias en mascotas.',   clinica:'Clínica Mascott', licencia:'CEDVET-003', password:'doctor3' },
  { id:'doc4', nombre:'Dra. Sofia Ramírez',  especialidad:'Nutrición Animal',    email:'sofia@mascott.com',  tel:'555-0004', exp:'5 años',  horario:'Lun-Vie 9am-3pm',   foto:'', bio:'Nutricionista veterinaria con planes personalizados.',       clinica:'Clínica Mascott', licencia:'CEDVET-004', password:'doctor4' },
  { id:'doc5', nombre:'Dr. Miguel Torres',   especialidad:'Urgencias 24h',       email:'miguel@mascott.com', tel:'555-0005', exp:'10 años', horario:'24/7 Urgencias',    foto:'', bio:'Especialista en medicina de urgencias disponible 24/7.',    clinica:'Clínica Mascott', licencia:'CEDVET-005', password:'doctor5' },
];

// ===== INICIALIZAR DOCTORES EN FIREBASE =====
async function inicializarDoctores() {
  try {
    const docs = await obtenerDoctores();
    if (docs.length === 0) {
      for (const d of DOCTORES_DEFAULT) await crearDoctor(d);
    }
  } catch(e) { console.warn('Error inicializando doctores:', e); }
}

// ===== REDIRIGIR SI YA HAY SESIÓN =====
if (getSession())                         location.replace('../paginas/panel-usuario.html');
else if (getDoctorSession())              location.replace('../paginas/panel-doctor.html');
else if (localStorage.getItem('macott_admin') === 'true') location.replace('../paginas/panel-administrador.html');

// ===== TABS =====
const tabLogin    = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const panelLogin  = document.getElementById('panel-login');
const panelReg    = document.getElementById('panel-register');

function showTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  panelLogin.classList.toggle('active', isLogin);
  panelReg.classList.toggle('active', !isLogin);
  panelLogin.hidden = !isLogin;
  panelReg.hidden   = isLogin;
}

tabLogin.addEventListener('click',    () => showTab('login'));
tabRegister.addEventListener('click', () => showTab('register'));
document.getElementById('goRegister').addEventListener('click', () => showTab('register'));
document.getElementById('goLogin').addEventListener('click',    () => showTab('login'));

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

// ===== LOGIN INTELIGENTE =====
// Detecta automáticamente si es admin, doctor o cliente por el email
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('l-email').value.trim().toLowerCase();
  const pass  = document.getElementById('l-pass').value;
  const msg   = document.getElementById('login-msg');

  let valid = true;
  valid = validate('l-email','le-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
  valid = validate('l-pass', 'le-pass',  v => v.length >= 1, 'Ingresa tu contraseña.') && valid;
  if (!valid) return;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Verificando...';
  msg.className = ''; msg.textContent = '';

  try {
    await inicializarDoctores();

    // ── 1. ¿ES ADMIN? ──────────────────────────────────────────────
    if (email === ADMIN_EMAIL) {
      if (pass === ADMIN_PASSWORD) {
        localStorage.setItem('macott_admin', 'true');
        msg.className = 'form-msg success';
        msg.textContent = '✅ Bienvenido Administrador';
        setTimeout(() => location.href = '../paginas/panel-administrador.html', 700);
      } else {
        msg.className = 'form-msg error';
        msg.textContent = '❌ Contraseña incorrecta.';
        btn.disabled = false; btn.textContent = 'Entrar';
      }
      return;
    }

    // ── 2. ¿ES DOCTOR? ─────────────────────────────────────────────
    const doctores = await obtenerDoctores();
    const doctor   = doctores.find(d => d.email && d.email.toLowerCase() === email);

    if (doctor) {
      // Obtener contraseña correcta (Firebase o default local)
      const passCorrecta = doctor.password
        || (DOCTORES_DEFAULT.find(d => d.id === doctor.id) || {}).password
        || '';

      if (pass === passCorrecta) {
        // Guardar password en Firebase si no la tenía
        if (!doctor.password) {
          try { await actualizarDoctor(doctor.id, { password: passCorrecta }); } catch(e) {}
        }
        setDoctorSession({ ...doctor, password: passCorrecta });
        msg.className = 'form-msg success';
        msg.textContent = `✅ Bienvenido/a ${doctor.nombre}`;
        setTimeout(() => location.href = '../paginas/panel-doctor.html', 700);
      } else {
        msg.className = 'form-msg error';
        msg.textContent = '❌ Contraseña incorrecta.';
        btn.disabled = false; btn.textContent = 'Entrar';
      }
      return;
    }

    // ── 3. ¿ES CLIENTE? ────────────────────────────────────────────
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
    const redirect = sessionStorage.getItem('macott_redirect');
    sessionStorage.removeItem('macott_redirect');
    setTimeout(() => location.href = redirect === 'cita'
      ? '../paginas/calendario.html'
      : '../paginas/panel-usuario.html', 700);

  } catch(err) {
    console.error(err);
    msg.className = 'form-msg error';
    msg.textContent = '❌ Error de conexión. Intenta de nuevo.';
    btn.disabled = false; btn.textContent = 'Entrar';
  }
});

// ===== REGISTRO (solo clientes) =====
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const nombre   = document.getElementById('r-nombre').value.trim();
  const apellido = document.getElementById('r-apellido').value.trim();
  const email    = document.getElementById('r-email').value.trim().toLowerCase();
  const pass     = document.getElementById('r-pass').value;
  const pass2    = document.getElementById('r-pass2').value;
  const tel      = document.getElementById('r-tel').value.trim();
  const msg      = document.getElementById('register-msg');

  let valid = true;
  valid = validate('r-nombre',  're-nombre',  v => v.length >= 2, 'Ingresa tu nombre.')              && valid;
  valid = validate('r-apellido','re-apellido',v => v.length >= 2, 'Ingresa tu apellido.')             && valid;
  valid = validate('r-email',   're-email',   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
  valid = validate('r-pass',    're-pass',    v => v.length >= 6, 'Mínimo 6 caracteres.')             && valid;
  valid = validate('r-pass2',   're-pass2',   v => v === pass,    'Las contraseñas no coinciden.')    && valid;
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
    await crearUsuario({
      nombre, apellido, email, password: pass, tel,
      citas:[], mascotas:[], carrito:[], pedidos:[],
      fechaRegistro: new Date().toISOString()
    });
    setSession({ nombre, apellido, email, tel });
    msg.className = 'form-msg success';
    msg.textContent = `✅ ¡Cuenta creada! Bienvenido/a ${nombre}...`;
    const redirect = sessionStorage.getItem('macott_redirect');
    sessionStorage.removeItem('macott_redirect');
    setTimeout(() => location.href = redirect === 'cita'
      ? '../paginas/calendario.html'
      : '../paginas/panel-usuario.html', 900);
  } catch(err) {
    msg.className = 'form-msg error';
    msg.textContent = '❌ Error al crear cuenta.';
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  }
});
