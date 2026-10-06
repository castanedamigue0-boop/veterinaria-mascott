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


// ── Conectar botón "Mi cuenta" al side panel ──
document.getElementById('btnLogin')?.addEventListener('click', () => {
  window._sp?.open('login');
});
