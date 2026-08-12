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
let _pacienteSeleccionado = null; // { nombre, userEmail, mascotaId }

function renderPacientes() {
  const citas = misCitas();
  const vistos = new Set();
  const pacientes = [];
  citas.forEach(c => {
    const key = c.mascota + '|' + c.userEmail;
    if (!vistos.has(key)) {
      vistos.add(key);
      const user = allUsers.find(u => u.email === c.userEmail);
      const mascotaData = (user?.mascotas || []).find(m => m.nombre.toLowerCase() === c.mascota.toLowerCase());
      pacientes.push({
        nombre:     c.mascota,
        especie:    mascotaData?.especie || '🐾',
        raza:       mascotaData?.raza    || '',
        edad:       mascotaData?.edad    || '',
        peso:       mascotaData?.peso    || '',
        mascotaId:  mascotaData?.id      || '',
        dueno:      c.userName.trim(),
        userEmail:  c.userEmail,
        tel:        c.userTel,
        citas:      citas.filter(x => x.mascota === c.mascota && x.userEmail === c.userEmail).length,
        historial:  mascotaData?.historial || [],
      });
    }
  });

  // Ocultar historial al re-renderizar
  const histWrap = document.getElementById('docHistorialWrap');
  if (histWrap) histWrap.style.display = 'none';

  const grid = document.getElementById('docPacientesList');
  if (!grid) return;
  grid.innerHTML = pacientes.length
    ? pacientes.map(p => `
        <div class="paciente-card">
          <span class="paciente-emoji">${p.especie.split(' ')[0] || '🐾'}</span>
          <h4>${p.nombre}</h4>
          <p>${p.especie.split(' ').slice(1).join(' ') || 'Mascota'}${p.raza ? ' — ' + p.raza : ''}${p.edad ? ' — ' + p.edad + ' años' : ''}${p.peso ? ' — ' + p.peso + ' kg' : ''}</p>
          <p style="margin-top:.4rem;font-size:.75rem;color:#546e7a">📅 ${p.citas} cita(s) &nbsp;|&nbsp; 📋 ${p.historial.length} registro(s)</p>
          <span class="paciente-dueno">👤 ${p.dueno}${p.tel ? ' · ' + p.tel : ''}</span>
          <button class="doc-btn-primary" style="width:100%;margin-top:.85rem;justify-content:center;font-size:.85rem"
            data-email="${p.userEmail}" data-mascota="${p.nombre}" data-id="${p.mascotaId}">
            📋 Ver historial clínico
          </button>
        </div>`).join('')
    : '<p class="empty-msg" style="grid-column:1/-1">No tienes pacientes asignados aún.</p>';

  // Bind botones historial
  grid.querySelectorAll('[data-email]').forEach(btn => {
    btn.addEventListener('click', () => {
      _pacienteSeleccionado = {
        nombre:    btn.dataset.mascota,
        userEmail: btn.dataset.email,
        mascotaId: btn.dataset.id,
      };
      abrirHistorial();
    });
  });
}

function abrirHistorial() {
  if (!_pacienteSeleccionado) return;
  const wrap = document.getElementById('docHistorialWrap');
  if (!wrap) return;
  wrap.style.display = 'block';
  document.getElementById('docHistorialTitulo').textContent =
    '📋 Historial clínico — ' + _pacienteSeleccionado.nombre;

  // Form cerrar
  document.getElementById('btnCerrarHistorialDoc').onclick = () => { wrap.style.display = 'none'; };

  // Botón nuevo registro
  document.getElementById('btnNuevoRegistroDoc').onclick = () => {
    const fw = document.getElementById('docRegistroFormWrap');
    fw.style.display = fw.style.display === 'none' ? 'block' : 'none';
    if (fw.style.display === 'block') {
      // Setear fecha de hoy
      document.getElementById('hc-fecha').value = new Date().toISOString().split('T')[0];
    }
  };
  document.getElementById('btnCancelarRegistroDoc').onclick = () => {
    document.getElementById('docRegistroFormWrap').style.display = 'none';
  };

  // Submit historial
  const form = document.getElementById('docFormHistorial');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const msg = document.getElementById('hc-msg');
    const fecha       = document.getElementById('hc-fecha').value;
    const tipo        = document.getElementById('hc-tipo').value;
    const motivo      = document.getElementById('hc-motivo').value.trim();
    const diagnostico = document.getElementById('hc-diagnostico').value.trim();

    if (!fecha || !tipo || !motivo || !diagnostico) {
      msg.className = 'form-msg error';
      msg.textContent = '❌ Completa los campos obligatorios (fecha, tipo, motivo y diagnóstico).';
      return;
    }

    const registro = {
      id:            Date.now().toString(),
      fecha,
      tipo,
      peso:          document.getElementById('hc-peso').value || '',
      temperatura:   document.getElementById('hc-temp').value || '',
      motivo,
      examen:        document.getElementById('hc-examen').value.trim(),
      diagnostico,
      tratamiento:   document.getElementById('hc-tratamiento').value.trim(),
      medicamentos:  document.getElementById('hc-medicamentos').value.trim(),
      vacunas:       document.getElementById('hc-vacunas').value.trim(),
      observaciones: document.getElementById('hc-observaciones').value.trim(),
      proxCita:      document.getElementById('hc-proxcita').value || '',
      estadoSalida:  document.getElementById('hc-estado-salida').value,
      doctor:        doctor.nombre,
      doctorId:      doctor.id,
      fechaRegistro: new Date().toISOString(),
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Guardando...';

    try {
      const user = allUsers.find(u => u.email === _pacienteSeleccionado.userEmail);
      if (!user) throw new Error('Usuario no encontrado');

      // Buscar mascota por id o nombre
      let mascota = (user.mascotas || []).find(m => m.id === _pacienteSeleccionado.mascotaId);
      if (!mascota) mascota = (user.mascotas || []).find(m => m.nombre.toLowerCase() === _pacienteSeleccionado.nombre.toLowerCase());
      if (!mascota) {
        // Crear mascota si no existe en el registro del usuario
        mascota = { id: Date.now().toString(), nombre: _pacienteSeleccionado.nombre, especie: '🐾 Desconocida', raza: '', edad: '', historial: [] };
        user.mascotas = [...(user.mascotas || []), mascota];
      }
      if (!mascota.historial) mascota.historial = [];
      mascota.historial.unshift(registro); // más reciente primero

      await actualizarUsuario(_pacienteSeleccionado.userEmail, { mascotas: user.mascotas });
      msg.className = 'form-msg success'; msg.textContent = '✅ Registro guardado correctamente.';
      e.target.reset();
      btn.disabled = false; btn.textContent = '💾 Guardar registro';
      document.getElementById('docRegistroFormWrap').style.display = 'none';

      // Recargar datos y re-renderizar historial
      await cargarDatos();
      renderHistorialLista();
      setTimeout(() => { msg.textContent = ''; msg.className = 'form-msg'; }, 3000);
    } catch(err) {
      console.error(err);
      msg.className = 'form-msg error'; msg.textContent = '❌ Error al guardar. Intenta de nuevo.';
      btn.disabled = false; btn.textContent = '💾 Guardar registro';
    }
  };

  renderHistorialLista();
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderHistorialLista() {
  if (!_pacienteSeleccionado) return;
  const user = allUsers.find(u => u.email === _pacienteSeleccionado.userEmail);
  let mascota = (user?.mascotas || []).find(m => m.id === _pacienteSeleccionado.mascotaId);
  if (!mascota) mascota = (user?.mascotas || []).find(m => m.nombre.toLowerCase() === _pacienteSeleccionado.nombre.toLowerCase());

  const registros = mascota?.historial || [];
  const lista = document.getElementById('docHistorialList');
  if (!lista) return;

  const estadoLabels = {
    estable:       '😊 Estable',
    mejorando:     '📈 Mejorando',
    critico:       '⚠️ Crítico',
    hospitalizado: '🏥 Hospitalizado',
    dado_de_alta:  '✅ Dado de alta',
  };

  lista.innerHTML = registros.length
    ? registros.map(r => `
        <div class="doc-hc-item">
          <div class="hc-header">
            <span class="hc-tipo">${r.tipo}</span>
            <span class="hc-fecha">📅 ${r.fecha}</span>
            <span class="hc-doctor">🩺 ${r.doctor || doctor.nombre}</span>
            <span class="doc-hc-estado ${r.estadoSalida}">${estadoLabels[r.estadoSalida] || r.estadoSalida}</span>
          </div>
          <div class="doc-hc-grid">
            ${r.peso        ? `<div class="doc-hc-campo"><strong>⚖️ Peso</strong>${r.peso} kg</div>` : ''}
            ${r.temperatura ? `<div class="doc-hc-campo"><strong>🌡️ Temperatura</strong>${r.temperatura} °C</div>` : ''}
            ${r.motivo      ? `<div class="doc-hc-campo doc-form-full"><strong>📌 Motivo / Cómo llegó</strong>${r.motivo}</div>` : ''}
            ${r.examen      ? `<div class="doc-hc-campo doc-form-full"><strong>🔍 Examen físico</strong>${r.examen}</div>` : ''}
            ${r.diagnostico ? `<div class="doc-hc-campo doc-form-full"><strong>🩺 Diagnóstico</strong>${r.diagnostico}</div>` : ''}
            ${r.tratamiento ? `<div class="doc-hc-campo doc-form-full"><strong>💉 Tratamiento aplicado</strong>${r.tratamiento}</div>` : ''}
            ${r.medicamentos? `<div class="doc-hc-campo doc-form-full"><strong>💊 Medicamentos</strong>${r.medicamentos}</div>` : ''}
            ${r.vacunas     ? `<div class="doc-hc-campo doc-form-full"><strong>🛡️ Vacunas</strong>${r.vacunas}</div>` : ''}
            ${r.observaciones?`<div class="doc-hc-campo doc-form-full"><strong>📝 Observaciones / Indicaciones</strong>${r.observaciones}</div>` : ''}
            ${r.proxCita    ? `<div class="doc-hc-campo"><strong>📅 Próxima cita</strong>${r.proxCita}</div>` : ''}
          </div>
        </div>`).join('')
    : '<div class="doc-hc-empty">📋 Sin registros clínicos aún. Agrega el primero.</div>';
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
