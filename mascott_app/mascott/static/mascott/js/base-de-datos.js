// =============================================
// BASE DE DATOS — Conexión con el backend Django
// Todas las peticiones van al servidor Django.
// Nunca se guardan contraseñas en el navegador.
// =============================================

// URL base del servidor Django
const API_URL = 'http://127.0.0.1:8000';

// ─────────────────────────────────────────
// FUNCIÓN AUXILIAR — Petición fetch con CSRF
// Django requiere el token CSRF en todas las
// peticiones POST para evitar ataques.
// ─────────────────────────────────────────
async function apiFetch(endpoint, opciones = {}) {
  // Obtener el token CSRF de la cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1] || '';

  const config = {
    credentials: 'include',         // enviar cookies de sesión
    headers: {
      'Content-Type':  'application/json',
      'X-CSRFToken':   csrfToken,    // token de seguridad
    },
    ...opciones,
  };

  const respuesta = await fetch(`${API_URL}${endpoint}`, config);
  const datos     = await respuesta.json();

  if (!respuesta.ok && !datos.ok) {
    throw new Error(datos.error || 'Error en el servidor.');
  }
  return datos;
}

// ─────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────

// Iniciar sesión — devuelve { ok, nombre, email, esAdmin }
export async function iniciarSesion(email, password) {
  return await apiFetch('/api/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Registrar cuenta nueva — devuelve { ok, nombre, email }
export async function registrarUsuario(nombre, apellido, email, password, telefono = '') {
  return await apiFetch('/api/registro/', {
    method: 'POST',
    body: JSON.stringify({ nombre, apellido, email, password, telefono }),
  });
}

// Cerrar sesión
export async function cerrarSesion() {
  return await apiFetch('/api/logout/');
}

// Verificar si hay sesión activa — devuelve { autenticado, nombre, email }
export async function verificarSesion() {
  return await apiFetch('/api/sesion/');
}

// ─────────────────────────────────────────
// CITAS
// ─────────────────────────────────────────

// Obtener las citas del usuario autenticado
export async function obtenerCitas() {
  return await apiFetch('/api/citas/');
}

// Crear una cita nueva
export async function crearCita(mascota, servicio, fecha, hora, notas = '') {
  return await apiFetch('/api/citas/crear/', {
    method: 'POST',
    body: JSON.stringify({ mascota, servicio, fecha, hora, notas }),
  });
}

// Obtener horas ya ocupadas para una fecha
export async function obtenerHorasOcupadas(fecha) {
  return await apiFetch(`/api/citas/horarios/?fecha=${fecha}`);
}

// ─────────────────────────────────────────
// MASCOTAS
// ─────────────────────────────────────────

// Obtener las mascotas del usuario autenticado
export async function obtenerMascotas() {
  return await apiFetch('/api/mascotas/');
}

// Registrar una mascota nueva
export async function crearMascota(nombre, especie, raza = '', edad = null) {
  return await apiFetch('/api/mascotas/crear/', {
    method: 'POST',
    body: JSON.stringify({ nombre, especie, raza, edad }),
  });
}

// ─────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────

// Obtener productos activos de la tienda
export async function obtenerProductos() {
  return await apiFetch('/api/productos/');
}

// ─────────────────────────────────────────
// SESIÓN LOCAL (solo para UI, sin datos sensibles)
// Guarda solo el nombre del usuario para
// mostrar en el botón del navbar.
// ─────────────────────────────────────────

export function setSession(user) {
  // Solo guarda nombre y email — nunca la contraseña
  sessionStorage.setItem('mascott_user', JSON.stringify({
    nombre:  user.nombre,
    email:   user.email,
    esAdmin: user.esAdmin || false,
  }));
}

export function getSession() {
  const data = sessionStorage.getItem('mascott_user');
  return data ? JSON.parse(data) : null;
}

export function clearSession() {
  sessionStorage.removeItem('mascott_user');
}
