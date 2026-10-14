// =============================================
// SEGURIDAD DEL LADO DEL CLIENTE
// Protege la página contra manipulaciones básicas.
// El F12 está habilitado para el desarrollador.
// =============================================

(function () {

  // 1. DESACTIVAR CLIC DERECHO en visitantes
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  // 2. BLOQUEAR SOLO Ctrl+U (ver código fuente) y Ctrl+S (guardar página)
  // F12 y DevTools se dejan libres para el desarrollador
  document.addEventListener('keydown', function (e) {

    // Ctrl+U — ver código fuente
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    // Ctrl+S — guardar página
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return false;
    }

  });

  // 3. BLOQUEAR ARRASTRAR IMÁGENES
  document.addEventListener('dragstart', function (e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // 4. PROTECCIÓN CONTRA IFRAMES
  // Evita que la página sea embebida en otro sitio web
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }

})();
