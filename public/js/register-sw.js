/**
 * R41 - Service Worker Registration
 * Handles registration, update detection, and lifecycle logging.
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) {
    console.log('[SW-Reg] Service Workers are not supported in this browser.');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW-Reg] Registration succeeded. Scope:', registration.scope);

        // Check for updates on page load
        registration.update();

        // R41 - Handle update found events
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[SW-Reg] New service worker found:', newWorker);

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available — prompt user to refresh
                console.log('[SW-Reg] New content is available. Please refresh for the latest version.');
              } else {
                // Content is now cached for the first time
                console.log('[SW-Reg] Content is cached and ready for offline use.');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[SW-Reg] Registration failed:', error);
      });

    // Listen for controller change (user accepted the new SW)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW-Reg] New service worker activated. Reloading page.');
      window.location.reload();
    });
  });
})();
