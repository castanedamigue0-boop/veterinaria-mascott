// ===== SERVICE WORKER — Mascott PWA =====
const CACHE_NAME = 'mascott-v1';
const ASSETS = [
  './inicio.html',
  './inicio.css',
  './inicio.js',
  './login-registro.html',
  './login-registro.css',
  './login-registro.js',
  './panel-usuario.html',
  './panel-usuario.css',
  './panel-usuario.js',
  './tienda-productos.html',
  './tienda-productos.css',
  './tienda-productos.js',
  './panel-administrador.html',
  './panel-administrador.css',
  './panel-administrador.js',
  './base-de-datos.js',
  './logo.png',
  './fondo-principal.png',
  './manifest.json'
];

// Instalar — cachear assets estáticos
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activar — limpiar caches viejos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — Network first, fallback a cache
self.addEventListener('fetch', function(e) {
  // Solo manejar GET y misma origin
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Firebase y CDNs — solo network, sin cache
  if (e.request.url.includes('firestore') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('gstatic') ||
      e.request.url.includes('googleapis')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Guardar copia fresca en cache
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Sin red → servir desde cache
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./inicio.html');
        });
      })
  );
});
