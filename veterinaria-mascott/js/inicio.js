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

function abrirCitaOLogin() {
  if (typeof abrirMP === 'function') {
    abrirMP('cita');
  } else {
    window.location.href = 'login-registro.html';
  }
}

// Registrar modal cita con verificación de sesión
['btnCitaHero', 'btnCitaNav', 'btnCitaCard'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', abrirCitaOLogin);
});

// Cerrar modal cita
const citaOverlay = document.getElementById('modalCita');
if (citaOverlay) {
  citaOverlay.querySelector('.modal-close')?.addEventListener('click', () => closeModal('modalCita'));
  citaOverlay.addEventListener('click', (e) => { if (e.target === citaOverlay) closeModal('modalCita'); });
  modals['modalCita'] = citaOverlay;
}

// btnLogin → manejado por el mini panel en el HTML

// Sesión activa → cambiar botón
(function() {
  const session = localStorage.getItem('macott_session');
  if (!session) return;
  try {
    const user = JSON.parse(session);
    const btn  = document.getElementById('btnLogin');
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-user"></i><span>${user.nombre || 'Mi cuenta'}</span>`;
      btn.onclick = () => { window.location.href = 'panel-usuario.html'; };
    }
  } catch(e) {}
})();

// ===== TOGGLE CONTRASEÑA =====
function setupTogglePass(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', function () {
    const input = document.getElementById(inputId);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    this.textContent = show ? '🙈' : '👁';
    this.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
}
setupTogglePass('togglePass',      'login-pass');
setupTogglePass('toggleAdminPass', 'admin-pass');

// Submit login demo — ya no aplica en index, redirige a login-registro.html
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault(); closeModal('modalOverlay');
});
document.getElementById('adminForm')?.addEventListener('submit', (e) => {
  e.preventDefault(); closeModal('modalAdmin');
});

// ===== TARJETA HERO =====
(function () {
  const dias  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const hoy   = new Date();
  const horas = ['8:00','8:30','9:00','9:30','10:00'];
  const hora  = horas[Math.floor(Math.random() * horas.length)];
  const el    = document.getElementById('heroFecha');
  if (el) el.textContent = `${dias[hoy.getDay()]} ${hoy.getDate()} ${meses[hoy.getMonth()]} · ${hora} am`;

  // Estado abierto/cerrado
  const estadoEl    = document.getElementById('estadoClinica');
  const estadoBadge = document.getElementById('estadoBadge');
  const horaActual  = hoy.getHours() + hoy.getMinutes() / 60;
  const diaSemana   = hoy.getDay();
  let abierto = false;

  if (diaSemana === 0) {
    // Domingo: 10–12
    abierto = horaActual >= 10 && horaActual < 12;
    if (estadoEl) estadoEl.textContent = abierto ? '🟢 Abierto' : '🔴 Cerrado · Dom 10:00–12:00';
  } else if (diaSemana >= 1 && diaSemana <= 6) {
    // Lun–Sáb: 8:00–20:30
    abierto = horaActual >= 8 && horaActual < 20.5;
    if (estadoEl) estadoEl.textContent = abierto ? '🟢 Abierto ahora' : '🔴 Cerrado · Abre Lun 8:00 am';
  }

  if (estadoBadge) {
    estadoBadge.style.color = abierto ? '#1976d2' : '#e53935';
    estadoBadge.title = abierto ? 'Abierto ahora' : 'Cerrado';
  }
})();
const HORARIOS_BASE = ['9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
                       '12:00', '12:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
// Horarios "ocupados" simulados por fecha (índices)
const OCUPADOS = { 0: [1,4,7], 1: [0,3,6,9], 2: [2,5,8], 3: [1,3,10], 4: [0,4,7,11] };

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

let selectedFechaIdx = null;
let selectedHora     = null;

function buildFechas() {
  const grid = document.getElementById('fechasGrid');
  grid.innerHTML = '';
  const hoy = new Date();

  for (let i = 1; i <= 7; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    if (d.getDay() === 0) continue; // sin domingos

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fecha-btn';
    btn.dataset.idx = i - 1;
    btn.setAttribute('aria-label', `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`);
    btn.innerHTML = `<span class="dia-num">${d.getDate()}</span><span class="dia-nom">${DIAS[d.getDay()]}</span><span style="font-size:.7rem;color:var(--muted)">${MESES[d.getMonth()]}</span>`;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.fecha-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedFechaIdx = parseInt(btn.dataset.idx);
      selectedHora = null;
      document.getElementById('err-fecha').textContent = '';
      buildHorarios(selectedFechaIdx);
      document.getElementById('horariosWrap').style.display = 'block';
    });

    grid.appendChild(btn);
  }
}

function buildHorarios(idx) {
  const grid = document.getElementById('horariosGrid');
  grid.innerHTML = '';
  const ocupados = OCUPADOS[idx % 5] || [];

  HORARIOS_BASE.forEach((hora, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hora-btn' + (ocupados.includes(i) ? ' ocupado' : '');
    btn.textContent = hora;
    btn.setAttribute('aria-label', ocupados.includes(i) ? `${hora} no disponible` : hora);
    if (!ocupados.includes(i)) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedHora = hora;
        document.getElementById('err-hora').textContent = '';
      });
    }
    grid.appendChild(btn);
  });
}

// ===== SESIÓN - ACTUALIZAR UI =====
(function() {
  const session = localStorage.getItem('macott_session');
  if (!session) return;
  const user = JSON.parse(session);

  // Cambiar botón login por "Mi cuenta"
  ['btnLogin', 'btnLoginTop'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.innerHTML = `<span aria-hidden="true">👤</span> ${user.nombre}`;
    btn.onclick = () => { window.location.href = '../html/panel-usuario.html'; };
  });
})();

// buildFechas se llama desde abrirCitaOLogin()

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