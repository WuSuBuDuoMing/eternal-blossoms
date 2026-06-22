/**
 * R41 - Service Worker Registration
 * Handles registration, update detection, and lifecycle logging.
 * v1.12.0: Update notification banner, periodic update checks, cache management
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

        // v1.12.0: Periodic update checks every 60 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        // R41 - Handle update found events
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[SW-Reg] New service worker found:', newWorker);

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available — show update notification banner
                console.log('[SW-Reg] New content is available. Please refresh for the latest version.');
                showUpdateBanner(newWorker);
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

  /**
   * v1.12.0: Show a non-intrusive update notification banner
   * @param {ServiceWorker} newWorker
   */
  function showUpdateBanner(newWorker) {
    // Don't show duplicate banners
    if (document.getElementById('sw-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    Object.assign(banner.style, {
      position: 'fixed',
      bottom: '70px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      zIndex: '10000',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '12px',
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: '13px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      opacity: '0',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      willChange: 'transform, opacity',
    });

    const text = document.createElement('span');
    text.textContent = '🌸 New version available';
    banner.appendChild(text);

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    Object.assign(refreshBtn.style, {
      padding: '5px 14px',
      background: 'rgba(255, 107, 157, 0.2)',
      border: '1px solid rgba(255, 107, 157, 0.4)',
      borderRadius: '8px',
      color: '#ff6b9d',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    });
    refreshBtn.addEventListener('click', () => {
      if (newWorker && newWorker.postMessage) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    banner.appendChild(refreshBtn);

    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = '×';
    Object.assign(dismissBtn.style, {
      padding: '2px 6px',
      background: 'none',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: '16px',
      cursor: 'pointer',
    });
    dismissBtn.addEventListener('click', () => {
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => banner.remove(), 400);
    });
    banner.appendChild(dismissBtn);

    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translateX(-50%) translateY(0)';
    });
  }
})();
