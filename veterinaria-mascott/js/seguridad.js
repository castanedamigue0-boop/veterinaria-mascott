// =============================================
// SEGURIDAD DEL LADO DEL CLIENTE
// Protege la página contra manipulaciones básicas
// desde el navegador de otros dispositivos.
// =============================================

(function () {

  // 1. DESACTIVAR CLIC DERECHO
  // Evita que abran el menú contextual para "Ver código fuente"
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  // 2. BLOQUEAR ATAJOS DE TECLADO PARA INSPECCIONAR
  // Bloquea F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (ver código fuente)
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J (Consola)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (Inspector de elementos)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (Ver código fuente)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
    // Ctrl+S (Guardar página)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }
  });

  // 3. DETECTAR SI ALGUIEN ABRE LAS DEVTOOLS
  // Si la ventana cambia mucho de tamaño (señal de que abrieron DevTools),
  // recarga la página automáticamente
  var anchoNormal = window.outerWidth;
  var altoNormal  = window.outerHeight;

  setInterval(function () {
    var diferenciaAncho = window.outerWidth  - window.innerWidth  > 160;
    var diferenciaAlto  = window.outerHeight - window.innerHeight > 160;
    if (diferenciaAncho || diferenciaAlto) {
      // DevTools detectadas — mostrar advertencia
      document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0d47a1;color:#fff;font-family:Inter,sans-serif;text-align:center;gap:1rem;">' +
        '<img src="../img/logo.png" style="width:80px;border-radius:50%;" alt="Mascott"/>' +
        '<h1 style="font-size:2rem;">🔒 Acceso restringido</h1>' +
        '<p style="font-size:1rem;opacity:.8;">Esta página está protegida.<br/>Por favor cierra las herramientas del desarrollador.</p>' +
        '<button onclick="location.reload()" style="margin-top:1rem;padding:.8rem 2rem;background:#fff;color:#0d47a1;border:none;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;">Volver al inicio</button>' +
        '</div>';
    }
  }, 1000);

  // 4. PROTEGER EL TEXTO
  // Evita que seleccionen y copien el texto de la página
  document.addEventListener('selectstart', function (e) {
    // Solo bloquear fuera de los campos de formulario
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  });

  // 5. BLOQUEAR ARRASTRAR IMÁGENES
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // 6. PROTECCIÓN CONTRA IFRAMES
  // Evita que la página sea embebida en otro sitio web
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }

})();
