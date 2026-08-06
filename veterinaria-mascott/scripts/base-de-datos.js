// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhKqLIRubiPLeXwhoKyLvVTG8PNJZbRl4",
  authDomain: "veterinaria-mascott.firebaseapp.com",
  projectId: "veterinaria-mascott",
  storageBucket: "veterinaria-mascott.firebasestorage.app",
  messagingSenderId: "607015321799",
  appId: "1:607015321799:web:29944f85e3529266977ee2"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ===== USUARIOS =====
export async function crearUsuario(data) {
  await setDoc(doc(db, 'usuarios', data.email), data);
}

export async function obtenerUsuario(email) {
  const snap = await getDoc(doc(db, 'usuarios', email));
  return snap.exists() ? snap.data() : null;
}

export async function actualizarUsuario(email, data) {
  await setDoc(doc(db, 'usuarios', email), data, { merge: true });
}

export async function obtenerTodosUsuarios() {
  const snap = await getDocs(collection(db, 'usuarios'));
  return snap.docs.map(d => d.data());
}

export async function agregarNotificacion(email, msg) {
  const user = await obtenerUsuario(email);
  if (!user) return;
  const notifs = user.notificaciones || [];
  notifs.unshift({ msg, fecha: new Date().toLocaleString('es-CO'), leida: false });
  await setDoc(doc(db, 'usuarios', email), { notificaciones: notifs }, { merge: true });
}

// ===== DOCTORES =====
export async function obtenerDoctores() {
  const snap = await getDocs(collection(db, 'doctores'));
  return snap.docs.map(d => d.data());
}
export async function obtenerDoctor(id) {
  const snap = await getDoc(doc(db, 'doctores', id));
  return snap.exists() ? snap.data() : null;
}
export async function actualizarDoctor(id, data) {
  await setDoc(doc(db, 'doctores', id), data, { merge: true });
}
export async function crearDoctor(data) {
  await setDoc(doc(db, 'doctores', data.id), data);
}

// ===== SESION LOCAL =====
export function setSession(user) { localStorage.setItem('macott_session', JSON.stringify(user)); }
export function getSession()     { return JSON.parse(localStorage.getItem('macott_session') || 'null'); }
export function clearSession()   { localStorage.removeItem('macott_session'); }
export function setDoctorSession(doc) { localStorage.setItem('macott_doctor', JSON.stringify(doc)); }
export function getDoctorSession()    { return JSON.parse(localStorage.getItem('macott_doctor') || 'null'); }
export function clearDoctorSession()  { localStorage.removeItem('macott_doctor'); }
