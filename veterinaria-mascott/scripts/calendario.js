import {
  obtenerTodosUsuarios, actualizarUsuario,
  obtenerDoctores,
  getSession
} from '../scripts/base-de-datos.js';

// ===== SESIÓN =====
const session = getSession();
if (!session) window.location.replace('../paginas/login-registro.html');

// ===== HORARIOS DISPONIBLES =====
const HORARIOS = [
  '9:00 am','9:30 am','10:00 am','10:30 am',
  '11:00 am','11:30 am','12:00 pm',
  '4:00 pm','4:30 pm','5:00 pm','5:30 pm','6:00 pm'
];

// Estado global
let mesActual    = new Date().getMonth();
let anioActual   = new Date().getFullYear();
let fechaSel     = null;
let horaSel      = null;
let todosUsuarios = [];
let doctores      = [];

// Cache de horas ocupadas por fecha  { 'YYYY-MM-DD': ['9:00 am', ...] }
let cacheHoras = {};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('calUserName');
  if (el && session) el.textContent = session.nombre;

  // Cargar datos en paralelo
  [todosUsuarios, doctores] = await Promise.all([
    obtenerTodosUsuarios().catch(() => []),
    obtenerDoctores().catch(() => [])
  ]);

  // Pre-calcular horas ocupadas de todo el mes
  precalcularMes(anioActual, mesActual);
  renderCalendario();
  // Navegación mes
  document.getElementById('btnMesAnterior').addEventListener('click', () => {
    mesActual--;
    if (mesActual < 0) { mesActual = 11; anioActual--; }
    precalcularMes(anioActual, mesActual);
    renderCalendario();
  });
  document.getElementById('btnMesSiguiente').addEventListener('click', () => {
    mesActual++;
    if (mesActual > 11) { mesActual = 0; anioActual++; }
    precalcularMes(anioActual, mesActual);
    renderCalendario();
  });

  // Botones volver
  document.getElementById('btnVolverFecha').addEventListener('click', () => {
    irPaso(1); horaSel = null;
  });
  document.getElementById('btnVolverHora').addEventListener('click', () => {
    irPaso(2);
  });

  // Form confirmar
  document.getElementById('formCita').addEventListener('submit', confirmarCita);

  // Nueva cita (desde éxito)
  document.getElementById('btnNuevaCita').addEventListener('click', () => {
    fechaSel = null; horaSel = null;
    irPaso(1);
    renderCalendario();
  });
});

// ===== PRE-CALCULAR HORAS OCUPADAS =====
function precalcularMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha = `${anio}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cacheHoras[fecha] = horasOcupadasEnFecha(fecha);
  }
}

function horasOcupadasEnFecha(fecha) {
  const ocupadas = [];
  todosUsuarios.forEach(u => {
    (u.citas || []).forEach(c => {
      // Solo bloquear horas de citas pendientes o confirmadas
      // cancelada y completada liberan la hora
      if (c.fecha === fecha && c.estado !== 'cancelada' && c.estado !== 'completada') {
        ocupadas.push(c.hora);
      }
    });
  });
  return ocupadas;
}

// ===== RENDER CALENDARIO =====
function renderCalendario() {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  document.getElementById('calMesAnio').textContent = `${meses[mesActual]} ${anioActual}`;

  const grid   = document.getElementById('calGrid');
  const hoy    = new Date();
  hoy.setHours(0,0,0,0);
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);

  const primerDia  = new Date(anioActual, mesActual, 1).getDay(); // 0=Dom
  const diasEnMes  = new Date(anioActual, mesActual + 1, 0).getDate();

  let html = '';

  // Celdas vacías antes del primer día
  for (let i = 0; i < primerDia; i++) {
    html += '<div class="cal-dia vacio"></div>';
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const fecha     = `${anioActual}-${String(mesActual+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const fechaDate = new Date(anioActual, mesActual, d);
    const esHoy     = fechaDate.getTime() === hoy.getTime();
    const esDomingo = fechaDate.getDay() === 0;

    // Determinar estado del día
    let clase = '';
    let puntos = '';

    if (fechaDate < manana || esDomingo) {
      clase = 'pasado';
    } else {
      const ocupadas   = cacheHoras[fecha] || [];
      const disponibles = HORARIOS.length - ocupadas.length;
      if (disponibles === 0) {
        clase = 'lleno';
        puntos = '<div class="dia-puntos"><div class="punto punto-rojo"></div></div>';
      } else if (disponibles < HORARIOS.length / 2) {
        clase = 'parcial';
        puntos = '<div class="dia-puntos"><div class="punto punto-naranja"></div></div>';
      } else {
        clase = 'disponible';
        puntos = '<div class="dia-puntos"><div class="punto punto-verde"></div></div>';
      }
    }

    if (esHoy && clase !== 'pasado') clase += ' hoy';
    if (fecha === fechaSel) clase += ' seleccionado';

    const clickeable = clase.includes('disponible') || clase.includes('parcial') || clase.includes('hoy');
    html += `<div class="cal-dia ${clase}" ${clickeable ? `data-fecha="${fecha}"` : ''} role="${clickeable ? 'button' : ''}" aria-label="Día ${d}">
      <span class="dia-num">${d}</span>
      ${puntos}
    </div>`;
  }

  grid.innerHTML = html;

  // Eventos clic en días
  grid.querySelectorAll('.cal-dia[data-fecha]').forEach(dia => {
    dia.addEventListener('click', () => seleccionarFecha(dia.dataset.fecha));
  });
}

// ===== SELECCIONAR FECHA =====
async function seleccionarFecha(fecha) {
  fechaSel = fecha;

  // Recargar datos frescos de Firebase al seleccionar fecha
  try {
    todosUsuarios = await obtenerTodosUsuarios();
    // Actualizar cache del mes con datos frescos
    precalcularMes(anioActual, mesActual);
  } catch(e) { console.warn('Error recargando datos:', e); }

  renderCalendario(); // actualiza clase seleccionado
  irPaso(2);
  renderPaso2(fecha);
}

// ===== RENDER PASO 2 (HORAS + DOCTORES) =====
function renderPaso2(fecha) {
  // Fecha formateada
  const [y, m, d] = fecha.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const fechaObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
  document.getElementById('calFechaSel').textContent =
    `${dias[fechaObj.getDay()]} ${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;

  // Horas ocupadas ese día
  const ocupadas = cacheHoras[fecha] || horasOcupadasEnFecha(fecha);

  // ── DOCTORES ──
  renderDoctores(fecha, ocupadas);

  // ── HORAS ──
  const horasGrid = document.getElementById('horasGrid');
  horasGrid.innerHTML = HORARIOS.map(h => {
    const estaOcupada = ocupadas.includes(h);
    return `<button class="hora-btn ${horaSel === h ? 'seleccionada' : ''}"
      data-hora="${h}" ${estaOcupada ? 'disabled' : ''}>
      ${h}
      <span class="hora-estado">${estaOcupada ? '❌ Ocupado' : '✅ Libre'}</span>
    </button>`;
  }).join('');

  horasGrid.querySelectorAll('.hora-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => seleccionarHora(btn.dataset.hora));
  });
}

// ===== DOCTORES DISPONIBLES/OCUPADOS =====
function renderDoctores(fecha, horasOcupadas) {
  const grid = document.getElementById('doctoresGrid');
  if (!doctores.length) {
    grid.innerHTML = '<p style="color:#546e7a;font-size:.82rem">Cargando doctores...</p>';
    return;
  }

  // Un doctor está "ocupado" en esa fecha si tiene alguna cita confirmada/pendiente
  const doctoresOcupados = new Set();
  todosUsuarios.forEach(u => {
    (u.citas || []).forEach(c => {
      if (c.fecha === fecha && c.estado !== 'cancelada' && c.estado !== 'completada' && c.doctorId) {
        doctoresOcupados.add(c.doctorId);
      }
    });
  });

  grid.innerHTML = doctores.map(doc => {
    const ocupado = doctoresOcupados.has(doc.id);
    return `<div class="doctor-estado ${ocupado ? 'ocupado' : 'disponible'}">
      <div class="doc-dot"></div>
      <span class="doc-nombre-mini" title="${doc.nombre}">${doc.nombre.replace('Dr. ','Dr.').replace('Dra. ','Dra.')}</span>
      <span style="font-size:.7rem;margin-left:auto">${ocupado ? '🔴' : '🟢'}</span>
    </div>`;
  }).join('');
}

// ===== SELECCIONAR HORA =====
function seleccionarHora(hora) {
  horaSel = hora;

  // Actualizar visual
  document.querySelectorAll('.hora-btn').forEach(b => {
    b.classList.toggle('seleccionada', b.dataset.hora === hora);
  });

  irPaso(3);
  renderResumen();
}

// ===== RENDER RESUMEN =====
function renderResumen() {
  const [y, m, d] = fechaSel.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  document.getElementById('resumenCita').innerHTML = `
    <div class="res-item"><span>📅</span><strong>${parseInt(d)} ${meses[parseInt(m)-1]} ${y}</strong></div>
    <div class="res-item"><span>🕐</span><strong>${horaSel}</strong></div>
    <div class="res-item"><span>👤</span><strong>${session.nombre}</strong></div>`;
}

// ===== CONFIRMAR CITA =====
async function confirmarCita(e) {
  e.preventDefault();
  const mascota  = document.getElementById('c-mascota').value.trim();
  const servicio = document.getElementById('c-servicio').value;
  const notas    = document.getElementById('c-notas').value.trim();
  const msg      = document.getElementById('cita-msg');

  // Validar
  let valido = true;
  if (!mascota) {
    document.getElementById('e-mascota').textContent = 'Ingresa el nombre de tu mascota.';
    document.getElementById('c-mascota').style.borderColor = '#e53935';
    valido = false;
  } else {
    document.getElementById('e-mascota').textContent = '';
    document.getElementById('c-mascota').style.borderColor = '';
  }
  if (!servicio) {
    document.getElementById('e-servicio').textContent = 'Selecciona un servicio.';
    document.getElementById('c-servicio').style.borderColor = '#e53935';
    valido = false;
  } else {
    document.getElementById('e-servicio').textContent = '';
    document.getElementById('c-servicio').style.borderColor = '';
  }
  if (!valido) return;

  // Verificar que la hora sigue disponible (doble check)
  const ocupadasAhora = horasOcupadasEnFecha(fechaSel);
  if (ocupadasAhora.includes(horaSel)) {
    msg.className = 'form-msg error';
    msg.textContent = '⚠️ Esa hora acaba de ser tomada. Por favor elige otra.';
    setTimeout(() => { irPaso(2); renderPaso2(fechaSel); }, 2000);
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Guardando...';
  msg.className = ''; msg.textContent = '';

  try {
    // Cargar datos frescos del usuario
    const userActual = todosUsuarios.find(u => u.email === session.email);
    if (!userActual) throw new Error('Usuario no encontrado');

    const nuevaCita = {
      id:       Date.now().toString(),
      mascota,
      servicio,
      fecha:    fechaSel,
      hora:     horaSel,
      notas,
      estado:   'pendiente',
    };

    userActual.citas = [...(userActual.citas || []), nuevaCita];
    await actualizarUsuario(session.email, { citas: userActual.citas });

    // Actualizar cache local
    if (!cacheHoras[fechaSel]) cacheHoras[fechaSel] = [];
    cacheHoras[fechaSel].push(horaSel);

    // Recargar usuarios para reflejar cambio
    todosUsuarios = await obtenerTodosUsuarios().catch(() => todosUsuarios);
    precalcularMes(anioActual, mesActual);

    // Mostrar éxito
    irPaso(4);
    const [y, m, d] = fechaSel.split('-');
    const meses = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre'];
    document.getElementById('successDetalle').innerHTML = `
      <div class="det-item"><span>🐾</span><span><strong>Mascota:</strong> ${mascota}</span></div>
      <div class="det-item"><span>🩺</span><span><strong>Servicio:</strong> ${servicio}</span></div>
      <div class="det-item"><span>📅</span><span><strong>Fecha:</strong> ${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}</span></div>
      <div class="det-item"><span>🕐</span><span><strong>Hora:</strong> ${horaSel}</span></div>
      <div class="det-item"><span>⏳</span><span><strong>Estado:</strong> Pendiente de confirmación</span></div>`;

    // Limpiar form
    e.target.reset();
    btn.disabled = false; btn.textContent = '✅ Confirmar cita';

  } catch(err) {
    console.error(err);
    msg.className = 'form-msg error';
    msg.textContent = '❌ Error al guardar. Intenta de nuevo.';
    btn.disabled = false; btn.textContent = '✅ Confirmar cita';
  }
}

// ===== NAVEGAR ENTRE PASOS =====
function irPaso(num) {
  document.querySelectorAll('.cal-step').forEach((s, i) => {
    const activo = i + 1 === num;
    s.classList.toggle('active', activo);
    s.hidden = !activo;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
