// =============================================
// LOGIN Y REGISTRO — sin Firebase
// Todo se guarda en localStorage del navegador
// =============================================

// Credenciales del administrador
const ADMIN_EMAIL    = 'admin@mascott.com';
const ADMIN_PASSWORD = 'mascott2026';

// Credenciales de los doctores por defecto
const DOCTORES = [
  { id:'doc1', nombre:'Dr. Andrés García',   email:'andres@mascott.com',  password:'doctor1', rol:'doctor', especialidad:'Medicina General'    },
  { id:'doc2', nombre:'Dra. Laura Martínez', email:'laura@mascott.com',   password:'doctor2', rol:'doctor', especialidad:'Cirugía Veterinaria'  },
  { id:'doc3', nombre:'Dr. Carlos Pérez',    email:'carlos@mascott.com',  password:'doctor3', rol:'doctor', especialidad:'Dermatología'         },
  { id:'doc4', nombre:'Dra. Sofia Ramírez',  email:'sofia@mascott.com',   password:'doctor4', rol:'doctor', especialidad:'Nutrición Animal'     },
  { id:'doc5', nombre:'Dr. Miguel Torres',   email:'miguel@mascott.com',  password:'doctor5', rol:'doctor', especialidad:'Urgencias 24h'        },
];

// ── Helpers de sesión ──
function setSession(user)    { localStorage.setItem('macott_session', JSON.stringify(user)); }
function getSession()        { try { return JSON.parse(localStorage.getItem('macott_session')); } catch(e) { return null; } }
function clearSession()      { localStorage.removeItem('macott_session'); }
function getUsuarios()       { try { return JSON.parse(localStorage.getItem('macott_usuarios') || '[]'); } catch(e) { return []; } }
function saveUsuarios(arr)   { localStorage.setItem('macott_usuarios', JSON.stringify(arr)); }

// ── Si ya hay sesión activa, redirigir ──
const sesionActual = getSession();
if (sesionActual) {
  if      (sesionActual.rol === 'admin')  location.replace('../html/panel-administrador.html');
  else if (sesionActual.rol === 'doctor') location.replace('../html/panel-doctor.html');
  else                                    location.replace('../html/panel-usuario.html');
}

// ── Tabs login / registro ──
const tabLogin    = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const panelLogin  = document.getElementById('panel-login');
const panelReg    = document.getElementById('panel-register');

function showTab(tab) {
  const isLogin = tab === 'login';
  tabLogin   ?.classList.toggle('active', isLogin);
  tabRegister?.classList.toggle('active', !isLogin);
  if (panelLogin) { panelLogin.classList.toggle('active', isLogin);  panelLogin.hidden = !isLogin; }
  if (panelReg)   { panelReg.classList.toggle('active', !isLogin);   panelReg.hidden   =  isLogin; }
}

tabLogin   ?.addEventListener('click', () => showTab('login'));
tabRegister?.addEventListener('click', () => showTab('register'));
document.getElementById('goRegister')?.addEventListener('click', () => showTab('register'));
document.getElementById('goLogin')   ?.addEventListener('click', () => showTab('login'));

// Abrir en tab correcto si viene con ?tab=register
if (new URLSearchParams(location.search).get('tab') === 'register') showTab('register');

// ── Toggle mostrar/ocultar contraseña ──
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', function() {
    const input = document.getElementById(this.dataset.target);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    this.textContent = show ? '🙈' : '👁';
  });
});

// ── Medidor de fuerza de contraseña ──
const rPass    = document.getElementById('r-pass');
const strength = document.getElementById('passStrength');
if (rPass && strength) {
  rPass.addEventListener('input', () => {
    const v = rPass.value;
    let level = 0;
    if (v.length >= 6) level++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) level++;
    if (/[^A-Za-z0-9]/.test(v) && v.length >= 8) level++;
    const labels = ['', 'Débil', 'Media', 'Fuerte'];
    const cls    = ['', 'weak', 'medium', 'strong'];
    strength.className = 'pass-strength ' + (cls[level] || '');
    strength.innerHTML = v.length
      ? `<div class="bar"></div><div class="bar"></div><div class="bar"></div><span>${labels[level] || ''}</span>`
      : '';
  });
}

// ── Validación de campos ──
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

// ── FORMULARIO DE LOGIN ──
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const email = document.getElementById('l-email').value.trim().toLowerCase();
  const pass  = document.getElementById('l-pass').value;
  const msg   = document.getElementById('login-msg');

  // Validar campos
  let valid = true;
  valid = validate('l-email', 'le-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
  valid = validate('l-pass',  'le-pass',  v => v.length >= 1, 'Ingresa tu contraseña.') && valid;
  if (!valid) return;

  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Verificando...';
  msg.className = ''; msg.textContent = '';

  // 1. ¿Es administrador?
  if (email === ADMIN_EMAIL) {
    if (pass === ADMIN_PASSWORD) {
      setSession({ nombre: 'Administrador', email, rol: 'admin' });
      msg.className = 'form-msg success';
      msg.textContent = '✅ Bienvenido Administrador';
      setTimeout(() => location.href = '../html/panel-administrador.html', 700);
    } else {
      msg.className = 'form-msg error';
      msg.textContent = '❌ Contraseña incorrecta.';
      btn.disabled = false; btn.textContent = 'Entrar';
    }
    return;
  }

  // 2. ¿Es doctor?
  const doctor = DOCTORES.find(d => d.email === email);
  if (doctor) {
    if (pass === doctor.password) {
      setSession({ ...doctor, rol: 'doctor' });
      msg.className = 'form-msg success';
      msg.textContent = `✅ Bienvenido/a ${doctor.nombre}`;
      setTimeout(() => location.href = '../html/panel-doctor.html', 700);
    } else {
      msg.className = 'form-msg error';
      msg.textContent = '❌ Contraseña incorrecta.';
      btn.disabled = false; btn.textContent = 'Entrar';
    }
    return;
  }

  // 3. ¿Es cliente registrado?
  const usuarios = getUsuarios();
  const user = usuarios.find(u => u.email === email);

  if (!user || user.password !== pass) {
    msg.className = 'form-msg error';
    msg.textContent = '❌ Correo o contraseña incorrectos.';
    btn.disabled = false; btn.textContent = 'Entrar';
    return;
  }

  // Login exitoso como cliente
  setSession({ nombre: user.nombre, apellido: user.apellido, email: user.email, tel: user.tel, rol: 'cliente' });
  msg.className = 'form-msg success';
  msg.textContent = `✅ ¡Bienvenido/a ${user.nombre}!`;

  const redirect = sessionStorage.getItem('macott_redirect');
  sessionStorage.removeItem('macott_redirect');
  setTimeout(() => {
    location.href = redirect === 'cita'
      ? '../html/calendario.html'
      : '../html/panel-usuario.html';
  }, 700);
});

// ── FORMULARIO DE REGISTRO ──
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const nombre   = document.getElementById('r-nombre').value.trim();
  const apellido = document.getElementById('r-apellido').value.trim();
  const email    = document.getElementById('r-email').value.trim().toLowerCase();
  const pass     = document.getElementById('r-pass').value;
  const pass2    = document.getElementById('r-pass2').value;
  const tel      = document.getElementById('r-tel').value.trim();
  const msg      = document.getElementById('register-msg');

  // Validar todos los campos
  let valid = true;
  valid = validate('r-nombre',   're-nombre',   v => v.length >= 2, 'Ingresa tu nombre.')                           && valid;
  valid = validate('r-apellido', 're-apellido', v => v.length >= 2, 'Ingresa tu apellido.')                         && valid;
  valid = validate('r-email',    're-email',    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.')      && valid;
  valid = validate('r-pass',     're-pass',     v => v.length >= 6, 'Mínimo 6 caracteres.')                         && valid;
  valid = validate('r-pass2',    're-pass2',    v => v === pass, 'Las contraseñas no coinciden.')                   && valid;
  if (!valid) return;

  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Creando cuenta...';

  // Verificar que el correo no esté ya registrado
  const usuarios = getUsuarios();
  if (usuarios.find(u => u.email === email)) {
    msg.className = 'form-msg error';
    msg.textContent = '❌ Ya existe una cuenta con ese correo.';
    btn.disabled = false; btn.textContent = 'Crear cuenta';
    return;
  }

  // Crear y guardar el nuevo usuario
  const nuevoUsuario = {
    nombre, apellido, email, password: pass, tel,
    citas: [], mascotas: [], carrito: [], pedidos: [],
    fechaRegistro: new Date().toISOString()
  };
  usuarios.push(nuevoUsuario);
  saveUsuarios(usuarios);

  // Iniciar sesión automáticamente
  setSession({ nombre, apellido, email, tel, rol: 'cliente' });

  msg.className = 'form-msg success';
  msg.textContent = `✅ ¡Cuenta creada! Bienvenido/a ${nombre}...`;

  const redirect = sessionStorage.getItem('macott_redirect');
  sessionStorage.removeItem('macott_redirect');
  setTimeout(() => {
    location.href = redirect === 'cita'
      ? '../html/calendario.html'
      : '../html/panel-usuario.html';
  }, 900);
});
