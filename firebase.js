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
  const { setDoc } = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js");
  await setDoc(doc(db, 'usuarios', email), data, { merge: true });
}

export async function obtenerTodosUsuarios() {
  const snap = await getDocs(collection(db, 'usuarios'));
  return snap.docs.map(d => d.data());
}

// ===== SESION LOCAL =====
export function setSession(user) { localStorage.setItem('macott_session', JSON.stringify(user)); }
export function getSession()     { return JSON.parse(localStorage.getItem('macott_session') || 'null'); }
export function clearSession()   { localStorage.removeItem('macott_session'); }
