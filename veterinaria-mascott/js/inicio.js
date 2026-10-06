// ===== SPLASH (solo una vez por sesión) =====
(function() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  // Si ya se mostró antes, ocúltalo inmediatamente sin animación
  if (sessionStorage.getItem('mascott_splash_shown')) {
    splash.style.display = 'none';
    return;
  }
  // Primera vez: mostrarlo y luego ocultarlo
  splash.style.display = '';
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => {
      splash.style.display = 'none';
      sessionStorage.setItem('mascott_splash_shown', '1');
    }, 800);
  }, 1800);
})();

// ===== NAVBAR =====
const navbarBurger = document.getElementById('navbarBurger');
const navbarLinks  = document.getElementById('navbarLinks');

if (navbarBurger && navbarLinks) {
  navbarBurger.addEventListener('click', () => {
    const open = navbarLinks.classList.toggle('open');
    navbarBurger.classList.toggle('active', open);
    navbarBurger.setAttribute('aria-expanded', String(open));
  });
  // Cerrar al hacer click en un link
  navbarLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navbarLinks.classList.remove('open');
      navbarBurger.classList.remove('active');
      navbarBurger.setAttribute('aria-expanded', 'false');
    });
  });
  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!navbarBurger.contains(e.target) && !navbarLinks.contains(e.target)) {
      navbarLinks.classList.remove('open');
      navbarBurger.classList.remove('active');
      navbarBurger.setAttribute('aria-expanded', 'false');
    }
  });
}

// Navbar scroll shadow
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('navbar-scrolled', window.scrollY > 10);
});

// Link activo al hacer scroll
const navLinks = document.querySelectorAll('.navbar-links a[href^="#"]');
const sections = document.querySelectorAll('section[id]');
sections.forEach(s =>
  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.navbar-links a[href="#${entry.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.4 }).observe(s)
);

// ===== SCROLL REVEAL =====
new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
  });
}, { threshold: 0.12 }).observe && document.querySelectorAll('.reveal').forEach(el =>
  new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.12 }).observe(el)
);

// ===== CONTADOR ANIMADO =====
document.querySelectorAll('.stat-num').forEach(el => {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(el.dataset.target, 10);
        let current = 0;
        const step = target / (1500 / 16);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { el.textContent = target; clearInterval(timer); }
          else el.textContent = Math.floor(current);
        }, 16);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 }).observe(el);
});

// ===== GESTIÓN DE MODALES =====
const modals = {};

function registerModal(overlayId, ...openers) {
  const overlay = document.getElementById(overlayId);
  const closeBtn = overlay.querySelector('.modal-close');
  modals[overlayId] = overlay;

  openers.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal(overlayId));
  });

  closeBtn.addEventListener('click', () => closeModal(overlayId));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlayId); });
}

function openModal(id) {
  const overlay = modals[id];
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => overlay.querySelector('input, select')?.focus(), 100);
}

function closeModal(id) {
  const overlay = modals[id];
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function closeAllModals() {
  Object.keys(modals).forEach(id => closeModal(id));
}

// ===== SESIÓN =====
function estaLogueado() {
  return !!localStorage.getItem('macott_session');
}

// ===== SIDE PANEL =====
(function() {
  const panel   = document.getElementById('spPanel');
  const overlay = document.getElementById('spOverlay');
  const closeBtn= document.getElementById('spCloseBtn');
  if (!panel) return;

  const DIAS     = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const HORARIOS = ['8:00','8:30','9:00','9:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  const OCUPADOS = {0:[1,4,7],1:[0,3,9],2:[2,5,11],3:[1,6,10],4:[0,4,8]};
  let selFecha = null, selHora = null, modo = 'login';

  /* ── abrir / cerrar ── */
  function open(m) {
    modo = m || 'login';
    render();
    panel.classList.add('open');
    overlay.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  /* ── render según estado ── */
  function render() {
    const sess = localStorage.getItem('macott_session');
    const viewAuth = document.getElementById('spViewAuth');
    const viewUser = document.getElementById('spViewUser');
    const viewCita = document.getElementById('spViewCita');
    const hName    = document.getElementById('spHeaderName');
    const hSub     = document.getElementById('spHeaderSub');

    viewAuth.style.display = 'none';
    viewUser.style.display = 'none';
    viewCita.style.display = 'none';

    if (modo === 'cita') {
      if (sess) {
        // Logueado → mostrar formulario cita
        hName.textContent = 'Agendar Cita';
        hSub.textContent  = 'Completa los datos para reservar';
        viewCita.style.display = 'flex';
        if (!document.getElementById('spFechasGrid').children.length) buildFechas();
      } else {
        // No logueado → mostrar login con mensaje
        hName.textContent = 'Inicia sesión';
        hSub.textContent  = 'Necesitas cuenta para agendar';
        viewAuth.style.display = 'flex';
        // Mostrar aviso
        showLoginRequired();
      }
    } else {
      // modo login
      if (sess) {
        try {
          const u = JSON.parse(sess);
          hName.textContent = u.nombre || 'Mi cuenta';
          hSub.textContent  = 'En línea';
          viewUser.style.display = 'flex';
          document.getElementById('spUserAv').textContent    = (u.nombre||'U')[0].toUpperCase();
          document.getElementById('spUserName').textContent  = u.nombre  || 'Usuario';
          document.getElementById('spUserEmail').textContent = u.email   || '';
        } catch(e) {}
      } else {
        hName.textContent = 'Mascott';
        hSub.textContent  = 'Inicia sesión para continuar';
        viewAuth.style.display = 'flex';
      }
    }
  }

  function showLoginRequired() {
    // Insertar mensaje encima del form de login
    let msg = document.getElementById('spLoginRequired');
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'spLoginRequired';
      msg.className = 'sp-login-required';
      msg.innerHTML = '<p>Para agendar una cita necesitas <strong>iniciar sesión</strong> o <strong>crear una cuenta</strong>. Es rápido y gratis.</p>';
      document.getElementById('spViewAuth').insertBefore(msg, document.getElementById('spViewAuth').firstChild);
    }
    msg.style.display = 'block';
  }

  /* ── Tabs auth ── */
  document.querySelectorAll('.sp-auth-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sp-auth-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isLogin = btn.dataset.auth === 'login';
      document.getElementById('spFormLogin').style.display    = isLogin ? 'flex' : 'none';
      document.getElementById('spFormRegistro').style.display = isLogin ? 'none' : 'flex';
    });
  });

  /* ── Ver contraseña ── */
  panel.querySelectorAll('.sp-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.querySelector('i').className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });
  });

  /* ── Medidor contraseña ── */
  document.getElementById('sp-reg-pass')?.addEventListener('input', function() {
    const v = this.value, bar = document.getElementById('sp-strength');
    if (!bar) return;
    let s = 0;
    if (v.length >= 6) s++;
    if (/[A-Z0-9]/.test(v)) s++;
    if (v.length >= 10 && /[^A-Za-z0-9]/.test(v)) s++;
    bar.setAttribute('data-s', v.length ? s : '');
  });

  /* ── Cerrar ── */
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  panel.addEventListener('keydown', e => { if(e.key==='Escape') close(); });

  /* ── Logout ── */
  document.getElementById('spLogoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('macott_session');
    const btnL = document.getElementById('btnLogin');
    if (btnL) btnL.querySelector('span').textContent = 'Mi cuenta';
    render();
  });

  /* ── FORM LOGIN ── */
  document.getElementById('spFormLogin')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('sp-email').value.trim().toLowerCase();
    const pass  = document.getElementById('sp-pass').value;
    const msg   = document.getElementById('sp-login-msg');
    msg.className = 'sp-msg'; msg.textContent = '';
    const usuarios = JSON.parse(localStorage.getItem('macott_usuarios') || '[]');
    const user = usuarios.find(u => u.email === email && u.password === pass);
    if (user) {
      localStorage.setItem('macott_session', JSON.stringify(user));
      msg.textContent = `✅ ¡Bienvenido/a ${user.nombre}!`; msg.className = 'sp-msg success';
      const btnL = document.getElementById('btnLogin');
      if (btnL) btnL.querySelector('span').textContent = user.nombre;
      setTimeout(() => render(), 900);
    } else {
      msg.textContent = '❌ Correo o contraseña incorrectos.'; msg.className = 'sp-msg error';
    }
  });

  /* ── FORM REGISTRO ── */
  document.getElementById('spFormRegistro')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('sp-nombre').value.trim();
    const email  = document.getElementById('sp-reg-email').value.trim().toLowerCase();
    const pass   = document.getElementById('sp-reg-pass').value;
    const msg    = document.getElementById('sp-reg-msg');
    msg.className = 'sp-msg'; msg.textContent = '';
    if (!nombre || !email || pass.length < 6) {
      msg.textContent = '❌ Completa todos los campos.'; msg.className = 'sp-msg error'; return;
    }
    const usuarios = JSON.parse(localStorage.getItem('macott_usuarios') || '[]');
    if (usuarios.find(u => u.email === email)) {
      msg.textContent = '❌ Ya existe una cuenta con ese correo.'; msg.className = 'sp-msg error'; return;
    }
    const u = { nombre, apellido: document.getElementById('sp-apellido').value.trim(), email, password: pass };
    usuarios.push(u);
    localStorage.setItem('macott_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('macott_session', JSON.stringify(u));
    msg.textContent = `✅ ¡Cuenta creada! Bienvenido/a ${nombre}.`; msg.className = 'sp-msg success';
    const btnL = document.getElementById('btnLogin');
    if (btnL) btnL.querySelector('span').textContent = nombre;
    setTimeout(() => render(), 1000);
  });

  /* ── FECHAS CITA ── */
  function buildFechas() {
    const grid = document.getElementById('spFechasGrid'); grid.innerHTML = '';
    const hoy  = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(hoy); d.setDate(hoy.getDate() + i);
      if (d.getDay() === 0) continue;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'sp-fecha-btn'; btn.dataset.idx = i-1;
      btn.innerHTML = `<span class="dn">${d.getDate()}</span><span class="dm">${DIAS[d.getDay()]}</span><span class="dm">${MESES[d.getMonth()]}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sp-fecha-btn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel'); selFecha = parseInt(btn.dataset.idx); selHora = null;
        document.getElementById('sc-fecha-err').textContent = '';
        buildHoras(selFecha);
        document.getElementById('spHorasWrap').style.display = 'block';
      });
      grid.appendChild(btn);
    }
  }

  function buildHoras(idx) {
    const grid = document.getElementById('spHorasGrid'); grid.innerHTML = '';
    const ocu  = OCUPADOS[idx % 5] || [];
    HORARIOS.forEach((h, i) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'sp-hora-btn' + (ocu.includes(i) ? ' ocu' : '');
      btn.textContent = h;
      if (!ocu.includes(i)) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sp-hora-btn').forEach(b => b.classList.remove('sel'));
          btn.classList.add('sel'); selHora = h;
          document.getElementById('sc-hora-err').textContent = '';
        });
      }
      grid.appendChild(btn);
    });
  }

  /* ── FORM CITA ── */
  document.getElementById('spFormCita')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre   = document.getElementById('sc-nombre').value.trim();
    const mascota  = document.getElementById('sc-mascota').value.trim();
    const servicio = document.getElementById('sc-servicio').value;
    const msg      = document.getElementById('sc-msg');
    msg.className = 'sp-msg'; msg.textContent = '';
    let ok = true;
    if (!nombre || !mascota || !servicio) { msg.textContent = '❌ Completa todos los campos.'; msg.className = 'sp-msg error'; ok = false; }
    if (selFecha === null) { document.getElementById('sc-fecha-err').textContent = 'Selecciona una fecha.'; ok = false; }
    if (!selHora)          { document.getElementById('sc-hora-err').textContent  = 'Selecciona un horario.'; ok = false; }
    if (!ok) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = '⏳ Enviando...';
    setTimeout(() => {
      msg.textContent = `✅ ¡Cita confirmada! ${nombre} · ${servicio} · ${selHora}`; msg.className = 'sp-msg success';
      e.target.reset();
      document.querySelectorAll('.sp-fecha-btn,.sp-hora-btn').forEach(b => b.classList.remove('sel'));
      document.getElementById('spHorasWrap').style.display = 'none';
      selFecha = null; selHora = null;
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirmar Cita';
    }, 900);
  });

  // Exponer globalmente
  window._sp = { open, close };

  // Al cargar: si hay sesión activa, actualizar botón
  const sess = localStorage.getItem('macott_session');
  if (sess) {
    try {
      const u = JSON.parse(sess);
      const btnL = document.getElementById('btnLogin');
      if (btnL) btnL.querySelector('span').textContent = u.nombre || 'Mi cuenta';
    } catch(e) {}
  }
})();

function abrirCitaOLogin() {
  window._sp?.open('cita');
}
  const panel   = document.getElementById('sidePanel');
  const overlay = document.getElementById('sidePanelOverlay');
  const btnClose= document.getElementById('sidePanelClose');
  if (!panel) return;

  const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const HORARIOS = ['8:00','8:30','9:00','9:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
  const OCUPADOS = {0:[1,4,7],1:[0,3,9],2:[2,5,11],3:[1,6,10],4:[0,4,8]};
  let selFecha = null, selHora = null;

  function openPanel(tab) {
    panel.classList.add('open');
    overlay.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    if (tab) switchTab(tab);
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  function switchTab(name) {
    document.querySelectorAll('.sp-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
    document.getElementById('spLogin').style.display = name === 'spLogin' ? 'flex' : 'none';
    document.getElementById('spCita').style.display  = name === 'spCita'  ? 'flex' : 'none';
    if (name === 'spCita' && !document.getElementById('spFechasGrid').children.length) buildSPFechas();
    if (name === 'spLogin') renderLoginPanel();
  }

  function renderLoginPanel() {
    const sess = localStorage.getItem('macott_session');
    const loginForm = document.getElementById('spLoginForm');
    const userInfo  = document.getElementById('spUserInfo');
    if (sess) {
      try {
        const u = JSON.parse(sess);
        loginForm.style.display = 'none';
        userInfo.style.display  = 'block';
        document.getElementById('spUserAv').textContent    = (u.nombre||'U')[0].toUpperCase();
        document.getElementById('spUserName').textContent  = u.nombre  || 'Usuario';
        document.getElementById('spUserEmail').textContent = u.email   || '';
      } catch(e) {}
    } else {
      loginForm.style.display = 'block';
      userInfo.style.display  = 'none';
    }
  }

  // Tabs del panel
  document.querySelectorAll('.sp-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.panel));
  });

  // Auth sub-tabs (login / registro)
  document.querySelectorAll('.sp-auth-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sp-auth-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isLogin = btn.dataset.auth === 'login';
      document.getElementById('spFormLogin').style.display    = isLogin ? 'flex' : 'none';
      document.getElementById('spFormRegistro').style.display = isLogin ? 'none' : 'flex';
    });
  });

  // Ver contraseña
  panel.querySelectorAll('.sp-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.querySelector('i').className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });
  });

  // Cerrar
  btnClose.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  panel.addEventListener('keydown', e => { if(e.key==='Escape') closePanel(); });

  // Logout
  document.getElementById('spLogoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('macott_session');
    renderLoginPanel();
    const btnL = document.getElementById('btnLogin');
    if (btnL) btnL.querySelector('span').textContent = 'Mi cuenta';
  });

  // ── FORM LOGIN ──
  document.getElementById('spFormLogin')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('sp-email').value.trim().toLowerCase();
    const pass  = document.getElementById('sp-pass').value;
    const msg   = document.getElementById('sp-login-msg');
    msg.className = 'sp-msg'; msg.textContent = '';
    const usuarios = JSON.parse(localStorage.getItem('macott_usuarios') || '[]');
    const user = usuarios.find(u => u.email === email && u.password === pass);
    if (user) {
      localStorage.setItem('macott_session', JSON.stringify(user));
      msg.textContent = `✅ ¡Bienvenido/a ${user.nombre}!`; msg.className = 'sp-msg success';
      const btnL = document.getElementById('btnLogin');
      if (btnL) btnL.querySelector('span').textContent = user.nombre;
      setTimeout(() => { renderLoginPanel(); }, 900);
    } else {
      msg.textContent = '❌ Correo o contraseña incorrectos.'; msg.className = 'sp-msg error';
    }
  });

  // ── FORM REGISTRO ──
  document.getElementById('spFormRegistro')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('sp-nombre').value.trim();
    const email  = document.getElementById('sp-reg-email').value.trim().toLowerCase();
    const pass   = document.getElementById('sp-reg-pass').value;
    const msg    = document.getElementById('sp-reg-msg');
    msg.className = 'sp-msg'; msg.textContent = '';
    if (!nombre || !email || pass.length < 6) {
      msg.textContent = '❌ Completa todos los campos.'; msg.className = 'sp-msg error'; return;
    }
    const usuarios = JSON.parse(localStorage.getItem('macott_usuarios') || '[]');
    if (usuarios.find(u => u.email === email)) {
      msg.textContent = '❌ Ya existe una cuenta con ese correo.'; msg.className = 'sp-msg error'; return;
    }
    const newUser = { nombre, apellido: document.getElementById('sp-apellido').value.trim(), email, password: pass };
    usuarios.push(newUser);
    localStorage.setItem('macott_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('macott_session', JSON.stringify(newUser));
    msg.textContent = `✅ ¡Cuenta creada! Bienvenido/a ${nombre}.`; msg.className = 'sp-msg success';
    const btnL = document.getElementById('btnLogin');
    if (btnL) btnL.querySelector('span').textContent = nombre;
    setTimeout(() => renderLoginPanel(), 1000);
  });

  // ── FECHAS CITA ──
  function buildSPFechas() {
    const grid = document.getElementById('spFechasGrid');
    grid.innerHTML = '';
    const hoy = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(hoy); d.setDate(hoy.getDate() + i);
      if (d.getDay() === 0) continue;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'sp-fecha-btn';
      btn.dataset.idx = i - 1;
      btn.innerHTML = `<span class="dn">${d.getDate()}</span><span class="dm">${DIAS[d.getDay()]}</span><span class="dm">${MESES[d.getMonth()]}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sp-fecha-btn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        selFecha = parseInt(btn.dataset.idx);
        selHora  = null;
        document.getElementById('sc-fecha-err').textContent = '';
        buildSPHoras(selFecha);
        document.getElementById('spHorasWrap').style.display = 'block';
      });
      grid.appendChild(btn);
    }
  }

  function buildSPHoras(idx) {
    const grid = document.getElementById('spHorasGrid'); grid.innerHTML = '';
    const ocu  = OCUPADOS[idx % 5] || [];
    HORARIOS.forEach((h, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sp-hora-btn' + (ocu.includes(i) ? ' ocu' : '');
      btn.textContent = h;
      if (!ocu.includes(i)) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sp-hora-btn').forEach(b => b.classList.remove('sel'));
          btn.classList.add('sel'); selHora = h;
          document.getElementById('sc-hora-err').textContent = '';
        });
      }
      grid.appendChild(btn);
    });
  }

  // ── FORM CITA ──
  document.getElementById('spFormCita')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre   = document.getElementById('sc-nombre').value.trim();
    const mascota  = document.getElementById('sc-mascota').value.trim();
    const servicio = document.getElementById('sc-servicio').value;
    const msg      = document.getElementById('sc-msg');
    msg.className = 'sp-msg'; msg.textContent = '';
    let ok = true;
    if (!nombre || !mascota || !servicio) { msg.textContent = '❌ Completa nombre, mascota y servicio.'; msg.className = 'sp-msg error'; ok = false; }
    if (selFecha === null) { document.getElementById('sc-fecha-err').textContent = 'Selecciona una fecha.'; ok = false; }
    if (!selHora)          { document.getElementById('sc-hora-err').textContent  = 'Selecciona un horario.'; ok = false; }
    if (!ok) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = '⏳ Enviando...';
    setTimeout(() => {
      msg.textContent = `✅ ¡Cita confirmada! ${nombre} · ${servicio} · ${selHora}`; msg.className = 'sp-msg success';
      e.target.reset();
      document.querySelectorAll('.sp-fecha-btn,.sp-hora-btn').forEach(b => b.classList.remove('sel'));
      document.getElementById('spHorasWrap').style.display = 'none';
      selFecha = null; selHora = null;
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirmar Cita';
    }, 900);
  });

  // Exponer openPanel globalmente
  window.openSidePanel = openPanel;
  window.closeSidePanel = closePanel;

  // Al cargar: actualizar botón si hay sesión
  const sess = localStorage.getItem('macott_session');
  if (sess) {
    try {
      const u = JSON.parse(sess);
      const btnL = document.getElementById('btnLogin');
      if (btnL) btnL.querySelector('span').textContent = u.nombre || 'Mi cuenta';
    } catch(e) {}
  }
})();

function abrirCitaOLogin() {
  window.openSidePanel?.('spCita');
}

// Registrar modal cita con verificación de sesión
['btnCitaHero', 'btnCitaNav', 'btnCitaCard'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', abrirCitaOLogin);
});

// Cerrar modal cita
const citaOverlay = document.getElementById('modalCita');
if (citaOverlay) {
  citaOverlay.querySelector('.modal-close')?.addEventListener('click', () => {
    citaOverlay.classList.remove('open');
    citaOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
  citaOverlay.addEventListener('click', (e) => {
    if (e.target === citaOverlay) {
      citaOverlay.classList.remove('open');
      citaOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });
  modals['modalCita'] = citaOverlay;
}

// buildFechas se llama internamente en el side panel

// ===== FORMULARIO CITAS =====
document.getElementById('formCita').addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre   = document.getElementById('c-nombre');
  const mascota  = document.getElementById('c-mascota');
  const servicio = document.getElementById('c-servicio');
  const formMsg  = document.getElementById('formMsg');

  let valid = true;
  valid = validate(nombre,   'err-nombre',   'Ingresa tu nombre.')               && valid;
  valid = validate(mascota,  'err-mascota',  'Ingresa el nombre de tu mascota.') && valid;
  valid = validate(servicio, 'err-servicio', 'Selecciona un servicio.')          && valid;

  if (selectedFechaIdx === null) {
    document.getElementById('err-fecha').textContent = 'Selecciona una fecha.';
    valid = false;
  }
  if (!selectedHora) {
    document.getElementById('err-hora').textContent = 'Selecciona un horario.';
    valid = false;
  }
  if (!valid) return;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Enviando...';

  setTimeout(() => {
    formMsg.textContent = `✅ ¡Cita confirmada para ${nombre.value} y ${mascota.value} a las ${selectedHora}!`;
    formMsg.className = 'form-msg success';
    e.target.reset();
    document.querySelectorAll('.fecha-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('horariosWrap').style.display = 'none';
    selectedFechaIdx = null; selectedHora = null;
    btn.disabled = false;
    btn.innerHTML = '<span>✅</span> Confirmar Cita';
  }, 1000);
});

function validate(input, errId, msg) {
  const err = document.getElementById(errId);
  if (!input.value.trim()) { input.classList.add('invalid'); err.textContent = msg; return false; }
  input.classList.remove('invalid'); err.textContent = ''; return true;
}

['c-nombre','c-mascota','c-servicio'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', function () {
    this.classList.remove('invalid');
    const errId = 'err-' + id.replace('c-','');
    const el = document.getElementById(errId);
    if (el) el.textContent = '';
  });
});

// ===== SCROLL SUAVE =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});




(function() {
    var KB = [
      {tags:['servicio','servicios','hacen','ofrecen'],resp:'🩺 <strong>Nuestros servicios:</strong><br>• Consulta general y especializada<br>• 💉 Vacunación y desparasitación<br>• ✂️ Estética canina<br>• 🔬 Laboratorio propio<br>• 🩻 Rayos X y ecografía<br>• 🏥 Cirugías y urgencias 24h'},
      {tags:['horario','hora','abren','cierran'],resp:'🕐 <strong>Horario:</strong><br>• Lun–Sáb: 8:00 am – 8:30 pm<br>• Dom: 10:00 – 12:00<br>• 🚨 Urgencias 24h (Lun–Sáb)'},
      {tags:['cita','citas','agendar','reservar'],resp:'📅 Haz clic en <strong>"Agendar Cita"</strong> en el menú o <a href="#" onclick="document.getElementById(\'btnCitaHero\').click();return false;" style="color:#1565c0;font-weight:700">aquí</a> para abrir el formulario.'},
      {tags:['precio','precios','costo','cuanto','cobran'],resp:'💰 <strong>Precios orientativos:</strong><br>• Consulta: desde $80,000<br>• Vacunación: desde $45,000<br>• Estética: desde $60,000<br>• Desparasitación: desde $35,000'},
      {tags:['ubicacion','ubicación','donde','dirección','mapa'],resp:'📍 <strong>Calle 15 #9-54, Sogamoso, Boyacá</strong><br><a href="#ubicacion" style="color:#1565c0;font-weight:700">Ver mapa →</a>'},
      {tags:['urgencia','urgencias','emergencia','noche'],resp:'🚨 <strong>Urgencias 24h</strong> (Lun–Sáb)<br>📞 <a href="tel:+573114569768" style="color:#1565c0;font-weight:700">(+57) 311 456 9768</a>'},
      {tags:['hola','buenos','hey'],resp:'¡Hola! 👋 Soy <strong>Mascott Bot</strong>. ¿En qué te puedo ayudar? 🐾'},
      {tags:['gracias','perfecto','listo'],resp:'¡Con mucho gusto! 😊 Estamos para ayudarte siempre. 🐾'}
    ];
    var DEFAULT = '🤔 No entendí bien. Puedes preguntar sobre <strong>servicios, horarios, citas, precios o ubicación</strong>.<br>O llámanos: <a href="tel:+573114569768" style="color:#1565c0;font-weight:700">(+57) 311 456 9768</a>';
    function getResp(txt) {
      var l = txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      for (var i=0;i<KB.length;i++) for (var j=0;j<KB[i].tags.length;j++) if (l.indexOf(KB[i].tags[j])!==-1) return KB[i].resp;
      return DEFAULT;
    }
    var fab=document.getElementById('chatFab'), win=document.getElementById('chatWindow'),
        closeBtn=document.getElementById('chatClose'), body=document.getElementById('chatBody'),
        input=document.getElementById('chatInput'), sendBtn=document.getElementById('chatSend'),
        notif=document.getElementById('chatNotif'), sugs=document.getElementById('chatSugerencias'),
        isOpen=false;
    function hora(){ var d=new Date(); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); }
    function addMsg(txt,tipo){
      var w=document.createElement('div'); w.className='chat-msg '+tipo;
      var av=document.createElement('div'); av.className='chat-msg-avatar'; av.setAttribute('aria-hidden','true'); av.textContent=tipo==='bot'?'🐾':'👤';
      var inn=document.createElement('div');
      var bub=document.createElement('div'); bub.className='chat-msg-bubble'; bub.innerHTML=txt;
      var t=document.createElement('div'); t.className='chat-msg-time'; t.textContent=hora();
      inn.appendChild(bub); inn.appendChild(t); w.appendChild(av); w.appendChild(inn);
      body.appendChild(w); body.scrollTop=body.scrollHeight;
    }
    function typing(){ var w=document.createElement('div'); w.className='chat-msg bot'; w.id='chatTyping'; var av=document.createElement('div'); av.className='chat-msg-avatar'; av.textContent='🐾'; var d=document.createElement('div'); d.className='chat-typing'; d.innerHTML='<span></span><span></span><span></span>'; w.appendChild(av); w.appendChild(d); body.appendChild(w); body.scrollTop=body.scrollHeight; }
    function removeTyping(){ var t=document.getElementById('chatTyping'); if(t)t.remove(); }
    function responder(preg){ addMsg(preg,'user'); sugs.style.display='none'; typing(); setTimeout(function(){ removeTyping(); addMsg(getResp(preg),'bot'); sugs.style.display='flex'; },700+Math.random()*500); }
    function enviar(){ var txt=input.value.trim(); if(!txt)return; input.value=''; responder(txt); }
    fab.addEventListener('click',function(){ isOpen=!isOpen; win.hidden=!isOpen; fab.setAttribute('aria-expanded',String(isOpen)); if(notif)notif.style.display='none'; if(isOpen){ if(body.children.length===0){ typing(); setTimeout(function(){ removeTyping(); addMsg('¡Hola! 👋 Soy <strong>Mascott Bot</strong>. ¿En qué te puedo ayudar? 🐾','bot'); },800); } setTimeout(function(){input.focus();},100); } });
    closeBtn.addEventListener('click',function(){ isOpen=false; win.hidden=true; fab.setAttribute('aria-expanded','false'); });
    win.addEventListener('keydown',function(e){ if(e.key==='Escape'){isOpen=false;win.hidden=true;fab.focus();} });
    sendBtn.addEventListener('click',enviar);
    input.addEventListener('keydown',function(e){ if(e.key==='Enter')enviar(); });
    sugs.querySelectorAll('.chat-sug').forEach(function(b){ b.addEventListener('click',function(){ responder(b.dataset.q); }); });
    setTimeout(function(){ if(!isOpen&&notif)notif.style.display='flex'; },3000);
  })();

(function() {
    var fontSize=parseInt(localStorage.getItem('acc_font')||'100'), guiaOn=false;
    var panel=document.getElementById('accPanel'), toggleBtn=document.getElementById('accToggleBtn'), closeBtn=document.getElementById('accClose'), guiaLine=document.getElementById('guiaLine');
    if(!panel)return;
    function actualizarBarra(){ var fill=document.getElementById('accFontFill'); if(fill)fill.style.width=Math.max(5,((fontSize-70)/(150-70))*100)+'%'; }
    function setPill(id,on){ var btn=document.getElementById(id); if(!btn)return; btn.setAttribute('aria-checked',String(on)); var p=btn.querySelector('.acc-opt-pill'); if(p)p.textContent=on?'ON':'OFF'; }
    document.documentElement.style.fontSize=fontSize+'%';
    var fv=document.getElementById('accFontVal'); if(fv)fv.textContent=fontSize+'%';
    actualizarBarra();
    if(localStorage.getItem('acc_contraste')==='1'){document.body.classList.add('acc-contraste');setPill('accContraste',true);}
    if(localStorage.getItem('acc_oscuro')==='1'){document.body.classList.add('acc-oscuro');setPill('accOscuro',true);}
    if(localStorage.getItem('acc_links')==='1'){document.body.classList.add('acc-links');setPill('accLinks',true);}
    if(localStorage.getItem('acc_animaciones')==='1'){document.body.classList.add('acc-sin-animaciones');setPill('accAnimaciones',true);}
    if(localStorage.getItem('acc_guia')==='1'){guiaOn=true;if(guiaLine)guiaLine.style.display='block';setPill('accGuia',true);}
    toggleBtn.addEventListener('click',function(){ var open=panel.hidden; panel.hidden=!open; toggleBtn.setAttribute('aria-expanded',String(!open)); if(!open)toggleBtn.focus(); else setTimeout(function(){if(closeBtn)closeBtn.focus();},50); });
    if(closeBtn)closeBtn.addEventListener('click',function(){ panel.hidden=true; toggleBtn.setAttribute('aria-expanded','false'); toggleBtn.focus(); });
    panel.addEventListener('keydown',function(e){ if(e.key==='Escape'){panel.hidden=true;toggleBtn.focus();} });
    var bi=document.getElementById('accFontInc'), bd=document.getElementById('accFontDec');
    if(bi)bi.addEventListener('click',function(){ if(fontSize>=150)return; fontSize+=10; document.documentElement.style.fontSize=fontSize+'%'; if(fv)fv.textContent=fontSize+'%'; actualizarBarra(); localStorage.setItem('acc_font',fontSize); });
    if(bd)bd.addEventListener('click',function(){ if(fontSize<=70)return; fontSize-=10; document.documentElement.style.fontSize=fontSize+'%'; if(fv)fv.textContent=fontSize+'%'; actualizarBarra(); localStorage.setItem('acc_font',fontSize); });
    function makeToggle(id,cls,key){ var b=document.getElementById(id); if(!b)return; b.addEventListener('click',function(){ var on=b.getAttribute('aria-checked')==='true'; setPill(id,!on); document.body.classList.toggle(cls,!on); localStorage.setItem(key,on?'0':'1'); }); }
    makeToggle('accContraste','acc-contraste','acc_contraste');
    makeToggle('accOscuro','acc-oscuro','acc_oscuro');
    makeToggle('accLinks','acc-links','acc_links');
    makeToggle('accAnimaciones','acc-sin-animaciones','acc_animaciones');
    var bg=document.getElementById('accGuia');
    if(bg)bg.addEventListener('click',function(){ guiaOn=!guiaOn; setPill('accGuia',guiaOn); if(guiaLine)guiaLine.style.display=guiaOn?'block':'none'; localStorage.setItem('acc_guia',guiaOn?'1':'0'); });
    document.addEventListener('mousemove',function(e){ if(guiaOn&&guiaLine)guiaLine.style.top=(e.clientY-2)+'px'; });
    var br=document.getElementById('accReset');
    if(br)br.addEventListener('click',function(){ fontSize=100; document.documentElement.style.fontSize='100%'; if(fv)fv.textContent='100%'; actualizarBarra(); ['acc-contraste','acc-oscuro','acc-links','acc-sin-animaciones'].forEach(function(c){document.body.classList.remove(c);}); guiaOn=false; if(guiaLine)guiaLine.style.display='none'; ['accContraste','accOscuro','accLinks','accGuia','accAnimaciones'].forEach(function(id){setPill(id,false);}); ['acc_font','acc_contraste','acc_oscuro','acc_links','acc_guia','acc_animaciones'].forEach(function(k){localStorage.removeItem(k);}); });
  })();

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../js/servicio-offline.js').catch(() => {});
  });
}