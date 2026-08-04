import { crearUsuario, obtenerUsuario, actualizarUsuario, setSession, getSession } from './base-de-datos.js';

// Si ya hay sesión → dashboard
if (getSession()) window.location.href = 'panel-usuario.html';

// ===== TABS =====
const tabLogin    = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const panelLogin  = document.getElementById('panel-login');
const panelReg    = document.getElementById('panel-register');

function showTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabRegister.classList.toggle('active', !isLogin);
  tabLogin.setAttribute('aria-selected', String(isLogin));
  tabRegister.setAttribute('aria-selected', String(!isLogin));
  panelLogin.classList.toggle('active', isLogin);
  panelReg.classList.toggle('active', !isLogin);
  panelLogin.hidden = !isLogin;
  panelReg.hidden   = isLogin;
}

tabLogin.addEventListener('click',    () => showTab('login'));
tabRegister.addEventListener('click', () => showTab('register'));
document.getElementById('goRegister').addEventListener('click', () => showTab('register'));
document.getElementById('goLogin').addEventListener('click',    () => showTab('login'));
if (new URLSearchParams(location.search).get('tab') === 'register') showTab('register');

// ===== TOGGLE CONTRASEÑA =====
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', function () {
    const input = document.getElementById(this.dataset.target);
    const show  = input.type === 'password';
    input.type  = show ? 'text' : 'password';
    this.textContent = show ? '🙈' : '👁';
  });
});

// ===== FUERZA CONTRASEÑA =====
const rPass    = document.getElementById('r-pass');
const strength = document.getElementById('passStrength');
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

// ===== VALIDACIÓN =====
function validate(inputId, errId, check, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (!check(input.value)) {
    input.classList.add('invalid'); input.classList.remove('valid');
    err.textContent = msg; return false;
  }
  input.classList.remove('invalid'); input.classList.add('valid');
  err.textContent = ''; return true;
}

// ===== RECUPERAR CONTRASEÑA =====
document.getElementById('linkOlvide').addEventListener('click', function(e) {
  e.preventDefault();
  var wrap = document.getElementById('recoverWrap');
  wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  if (wrap.style.display === 'block') {
    var emailVal = document.getElementById('l-email').value.trim();
    if (emailVal) document.getElementById('recover-email').value = emailVal;
  }
});

document.getElementById('btnEnviarRecuperar').addEventListener('click', async function() {
  var email = document.getElementById('recover-email').value.trim();
  var msg   = document.getElementById('recover-msg');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.className = 'form-msg error'; msg.textContent = '❌ Ingresa un correo válido.'; return;
  }
  this.disabled = true; this.textContent = 'Verificando...';
  try {
    var user = await obtenerUsuario(email);
    if (!user) {
      msg.className = 'form-msg error';
      msg.textContent = '❌ No existe una cuenta con ese correo.';
      this.disabled = false; this.innerHTML = '<span>📧</span> Enviar contraseña temporal';
      return;
    }
    // Generar contraseña temporal
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var tempPass = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    await actualizarUsuario(email, { password: tempPass });
    msg.className = 'form-msg success';
    msg.innerHTML = '✅ Contraseña temporal generada:<br><strong style="font-size:1.1rem;letter-spacing:2px">' + tempPass + '</strong><br><small>Cópiala y úsala para iniciar sesión. Cámbiala desde tu perfil.</small>';
    this.disabled = false; this.innerHTML = '<span>📧</span> Enviar contraseña temporal';
  } catch(err) {
    msg.className = 'form-msg error'; msg.textContent = '❌ Error. Intenta de nuevo.';
    this.disabled = false; this.innerHTML = '<span>📧</span> Enviar contraseña temporal';
  }
});

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const msg   = document.getElementById('login-msg');
  let valid   = true;
  valid = validate('l-email', 'le-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
  valid = validate('l-pass',  'le-pass',  v => v.length >= 6, 'Mínimo 6 caracteres.') && valid;
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
    const redirect = sessionStorage.getItem('macott_redirect');
    sessionStorage.removeItem('macott_redirect');
    setTimeout(() => { window.location.href = redirect === 'cita' ? 'inicio.html#inicio' : 'panel-usuario.html'; }, 700);
  } catch(err) {
    msg.className = 'form-msg error';
    msg.textContent = '❌ Error de conexión. Intenta de nuevo.';
    btn.disabled = false; btn.textContent = 'Entrar';
  }
});

// ===== REGISTRO =====
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const nombre   = document.getElementById('r-nombre').value.trim();
  const apellido = document.getElementById('r-apellido').value.trim();
  const email    = document.getElementById('r-email').value.trim();
  const pass     = document.getElementById('r-pass').value;
  const pass2    = document.getElementById('r-pass2').value;
  const tel      = document.getElementById('r-tel').value.trim();
  const msg      = document.getElementById('register-msg');
  let valid      = true;

  valid = validate('r-nombre',   're-nombre',   v => v.length >= 2, 'Ingresa tu nombre.')    && valid;
  valid = validate('r-apellido', 're-apellido', v => v.length >= 2, 'Ingresa tu apellido.')  && valid;
  valid = validate('r-email',    're-email',    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Correo inválido.') && valid;
  valid = validate('r-pass',     're-pass',     v => v.length >= 6, 'Mínimo 6 caracteres.') && valid;
  valid = validate('r-pass2',    're-pass2',    v => v === pass,    'Las contraseñas no coinciden.') && valid;
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
    const newUser = {
      nombre, apellido, email, password: pass, tel,
      citas: [], mascotas: [], carrito: [], pedidos: [],
      fechaRegistro: new Date().toISOString()
    };
    await crearUsuario(newUser);
    setSession({ nombre, apellido, email, tel });
    msg.className = 'form-msg success';
    msg.textContent = `✅ ¡Cuenta creada! Bienvenido/a ${nombre}...`;
    const redirect = sessionStorage.getItem('macott_redirect');
    sessionStorage.removeItem('macott_redirect');
    setTimeout(() => { window.location.href = redirect === 'cita' ? 'inicio.html#inicio' : 'panel-usuario.html'; }, 900);
  } catch(err) {
    msg.className = 'form-msg error';
    msg.textContent = '❌ Error al crear cuenta. Intenta de nuevo.';
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  }
});
