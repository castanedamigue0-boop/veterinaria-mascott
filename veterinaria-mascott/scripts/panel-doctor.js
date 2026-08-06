import {
  obtenerTodosUsuarios, actualizarUsuario,
  getDoctorSession, clearDoctorSession, actualizarDoctor
} from '../scripts/base-de-datos.js';

// ===== SESIÓN =====
const doctor = getDoctorSession();
if (!doctor) window.location.replace('../paginas/login-registro.html');

let allUsers = [];
let filtroActivo = 'todas';

// ===== CARGAR DATOS =====
async function cargarDatos() {
  try {
    allUsers = await obtenerTodosUsuarios();
  } catch(e) {
    allUsers = [];
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  poblarPerfil();
  await cargarDatos();
  renderInicio();
  triggerReveal();

  // Sidebar nav
  document.querySelectorAll('.doc-link[data-section]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  // Menú móvil
  const sidebar = document.getElementById('docSidebar');
  const overlay = document.getElementById('docOverlay');
  document.getElementById('docMenuBtn').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  // Logout
  document.getElementById('btnDocLogout').addEventListener('click', cerrarSesion);
  document.getElementById('btnDocLogoutTop').addEventListener('click', cerrarSesion);

  // Filtros citas
  document.querySelectorAll('.filtro-btn[data-filt]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtro-btn[data-filt]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filtroActivo = btn.dataset.filt;
      renderCitas();
    });
  });

  // Foto de perfil
  const inputFoto = document.getElementById('inputFotoDoc');
  if (inputFoto) {
    inputFoto.addEventListener('change', async function() {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = e.target.result;
        // Actualizar en Firebase
        await actualizarDoctor(doctor.id, { foto: base64 });
        doctor.foto = base64;
        localStorage.setItem('macott_doctor', JSON.stringify(doctor));
        poblarPerfil();
        mostrarToast('✅ Foto actualizada');
      };
      reader.readAsDataURL(file);
    });
  }
});

function cerrarSesion() {
  clearDoctorSession();
  window.location.href = '../paginas/login-registro.html';
}

// ===== NAVEGACIÓN =====
function showSection(id) {
  document.querySelectorAll('.doc-section').forEach(s => {
    s.classList.remove('active');
    s.hidden = true;
  });
  document.querySelectorAll('.doc-link').forEach(b => b.classList.remove('active'));

  const sec = document.getElementById('sec-' + id);
  const btn = document.querySelector('.doc-link[data-section="' + id + '"]');
  if (sec) { sec.classList.add('active'); sec.hidden = false; }
  if (btn) btn.classList.add('active');

  if (window.innerWidth <= 900) {
    document.getElementById('docSidebar').classList.remove('open');
    document.getElementById('docOverlay').classList.remove('active');
  }

  const renders = {
    inicio:    renderInicio,
    citas:     renderCitas,
    pacientes: renderPacientes,
    perfil:    renderPerfil,
  };
  if (renders[id]) renders[id]();
  triggerReveal();
}

// ===== POBLAR PERFIL SIDEBAR =====
function poblarPerfil() {
  const inicial = (doctor.nombre || 'DR')[0].toUpperCase();

  // Sidebar
  const avatarSidebar = document.getElementById('docAvatarSidebar');
  if (avatarSidebar) {
    if (doctor.foto) {
      avatarSidebar.innerHTML = `<img src="${doctor.foto}" alt="Foto"/>`;
    } else {
      avatarSidebar.textContent = inicial;
    }
  }
  setText('docNombreSidebar', doctor.nombre || 'Doctor');
  setText('docEspSidebar',    doctor.especialidad || 'Especialidad');

  // Bienvenida
  setText('docBienvenidaNombre', doctor.nombre || 'Doctor');

  // Perfil grande
  const fotoGrande = document.getElementById('docFotoGrande');
  if (fotoGrande) {
    if (doctor.foto) {
      fotoGrande.innerHTML = `<img src="${doctor.foto}" alt="Foto"/>`;
    } else {
      fotoGrande.textContent = inicial;
    }
  }
  setText('docNombreGrande',  doctor.nombre       || 'Dr. Nombre');
  setText('docEspGrande',     doctor.especialidad || 'Especialidad');
  setText('docEmailPerfil',   doctor.email        || '—');
  setText('docTelPerfil',     doctor.tel          || 'Sin teléfono');
  setText('docClinicaPerfil', doctor.clinica      || 'Clínica Mascott');
  setText('docLicPerfil',     doctor.licencia     || '—');
  setText('docExpPerfil',     doctor.exp          || '—');
  setText('docHorarioPerfil', doctor.horario      || '—');
  setText('docBioPerfil',     doctor.bio          || 'Sin biografía.');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== OBTENER CITAS DEL DOCTOR =====
function misCitas() {
  const citas = [];
  allUsers.forEach(u => {
    (u.citas || []).forEach(c => {
      if (c.doctorId === doctor.id) {
        citas.push({ ...c, userEmail: u.email, userName: (u.nombre || '') + ' ' + (u.apellido || ''), userTel: u.tel || '' });
      }
    });
  });
  return citas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

// ===== INICIO =====
function renderInicio() {
  const citas     = misCitas();
  const hoy       = new Date().toISOString().split('T')[0];
  const citasHoy  = citas.filter(c => c.fecha === hoy);
  const pendientes = citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada');
  const atendidas  = citas.filter(c => c.estado === 'completada');

  // Pacientes únicos
  const pacientesUnicos = new Set(citas.map(c => c.mascota + c.userEmail));

  setText('statTotalCitas',  citasHoy.length);
  setText('statPendientes',  pendientes.length);
  setText('statAtendidas',   atendidas.length);
  setText('statPacientes',   pacientesUnicos.size);

  // Próximas citas (las 5 más próximas)
  const proximas = pendientes.slice(0, 5);
  const lista = document.getElementById('proxCitasList');
  if (lista) {
    lista.innerHTML = proximas.length
      ? proximas.map(c => citaItemHtml(c)).join('')
      : '<p class="empty-msg">No tienes citas próximas asignadas.</p>';
    bindCompletarBtns(lista);
  }
}

// ===== CITAS =====
function renderCitas() {
  const todas = misCitas();
  const filtradas = filtroActivo === 'todas'
    ? todas
    : todas.filter(c => c.estado === filtroActivo);

  const lista = document.getElementById('docCitasList');
  if (!lista) return;
  lista.innerHTML = filtradas.length
    ? filtradas.map(c => citaItemHtml(c)).join('')
    : '<p class="empty-msg">No hay citas en esta categoría.</p>';
  bindCompletarBtns(lista);
}

function citaItemHtml(c) {
  const badgeMap = {
    pendiente:  '<span class="cita-badge badge-pendiente">⏳ Pendiente</span>',
    confirmada: '<span class="cita-badge badge-confirmada">✅ Confirmada</span>',
    completada: '<span class="cita-badge badge-completada">🎉 Completada</span>',
    cancelada:  '<span class="cita-badge badge-cancelada">❌ Cancelada</span>',
  };
  const badge = badgeMap[c.estado] || '';
  const btnCompletar = (c.estado === 'confirmada' || c.estado === 'pendiente')
    ? `<button class="btn-completar" data-id="${c.id}" data-email="${c.userEmail}">✔ Marcar completada</button>`
    : '';

  return `
    <div class="cita-item ${c.estado}">
      <div class="cita-info">
        <h4>${c.servicio}</h4>
        <p>🐾 ${c.mascota} &nbsp;|&nbsp; 👤 ${c.userName.trim()}</p>
        <p>📅 ${c.fecha} &nbsp;·&nbsp; 🕐 ${c.hora}</p>
        ${c.notas ? `<p>📝 ${c.notas}</p>` : ''}
        ${c.userTel ? `<p>📞 ${c.userTel}</p>` : ''}
      </div>
      <div class="cita-acciones">
        ${badge}
        ${btnCompletar}
      </div>
    </div>`;
}

function bindCompletarBtns(container) {
  container.querySelectorAll('.btn-completar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const citaId   = btn.dataset.id;
      const email    = btn.dataset.email;
      const user     = allUsers.find(u => u.email === email);
      if (!user) return;
      user.citas = (user.citas || []).map(c => {
        if (c.id === citaId) c.estado = 'completada';
        return c;
      });
      await actualizarUsuario(email, { citas: user.citas });
      mostrarToast('🎉 Cita marcada como completada');
      await cargarDatos();
      renderCitas();
      renderInicio();
    });
  });
}

// ===== PACIENTES =====
function renderPacientes() {
  const citas = misCitas();
  // Agrupar por mascota única (mascota + email usuario)
  const vistos = new Set();
  const pacientes = [];
  citas.forEach(c => {
    const key = c.mascota + '|' + c.userEmail;
    if (!vistos.has(key)) {
      vistos.add(key);
      // Buscar datos de la mascota en el usuario
      const user = allUsers.find(u => u.email === c.userEmail);
      const mascotaData = (user?.mascotas || []).find(m => m.nombre.toLowerCase() === c.mascota.toLowerCase());
      pacientes.push({
        nombre:   c.mascota,
        especie:  mascotaData?.especie || '🐾',
        raza:     mascotaData?.raza    || '',
        edad:     mascotaData?.edad    || '',
        dueno:    c.userName.trim(),
        tel:      c.userTel,
        citas:    citas.filter(x => x.mascota === c.mascota && x.userEmail === c.userEmail).length,
      });
    }
  });

  const grid = document.getElementById('docPacientesList');
  if (!grid) return;
  grid.innerHTML = pacientes.length
    ? pacientes.map(p => `
        <div class="paciente-card">
          <span class="paciente-emoji">${p.especie.split(' ')[0] || '🐾'}</span>
          <h4>${p.nombre}</h4>
          <p>${p.especie.split(' ').slice(1).join(' ') || 'Mascota'}${p.raza ? ' — ' + p.raza : ''}${p.edad ? ' — ' + p.edad + ' años' : ''}</p>
          <p style="margin-top:.4rem;font-size:.75rem;color:#546e7a">📅 ${p.citas} cita(s)</p>
          <span class="paciente-dueno">👤 ${p.dueno}${p.tel ? ' · ' + p.tel : ''}</span>
        </div>`).join('')
    : '<p class="empty-msg" style="grid-column:1/-1">No tienes pacientes asignados aún.</p>';
}

// ===== PERFIL =====
function renderPerfil() {
  poblarPerfil();
}

// ===== REVEAL =====
function triggerReveal() {
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
  }, 80);
}

// ===== TOAST =====
function mostrarToast(msg) {
  let t = document.getElementById('docToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'docToast';
    t.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(80px);' +
      'background:#2e7d32;color:#fff;padding:.75rem 1.75rem;border-radius:50px;font-size:.9rem;' +
      'font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);' +
      'transition:transform .3s,opacity .3s;opacity:0;white-space:nowrap;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(80px)';
  }, 3000);
}
