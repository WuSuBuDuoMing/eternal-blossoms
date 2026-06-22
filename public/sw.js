/**
 * Service Worker - Eternal Blossoms PWA
 * R40: Cache strategies (cache-first for static, network-first for API)
 * R42: Offline fallback with embedded HTML page
 * v1.12.0: Enhanced caching — stale-while-revalidate for assets,
 *           background sync for API, improved cache lifecycle
 */

const VERSION = '1.17.0';
const CACHE_NAME = `eternal-blossoms-v${VERSION}`;
const RUNTIME_CACHE = `eternal-blossoms-runtime-v${VERSION}`;
const IMAGE_CACHE = `eternal-blossoms-images-v${VERSION}`;

// Static assets to pre-cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/effects.css',
  '/css/themes.css',
  '/css/search.css',
  '/js/app.js',
  '/js/app-init.js',
  '/js/layouts.js',
  '/js/particles.js',
  '/js/scene.js',
  '/js/ui.js',
  '/js/i18n.js',
  '/js/themes.js',
  '/js/perf-monitor.js',
  '/js/audio.js',
  '/js/analytics.js',
  '/js/search.js',
  '/js/share.js',
  '/js/gestures.js',
  '/js/register-sw.js',
  '/js/vendor/three.min.js',
  '/manifest.json'
];

// Maximum age for runtime cache entries (7 days)
const RUNTIME_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Maximum entries per cache to prevent unbounded growth
const MAX_RUNTIME_ENTRIES = 100;
const MAX_IMAGE_ENTRIES = 60;

// ---------------------------------------------------------------------------
// R42 - Offline fallback page (embedded HTML string)
// ---------------------------------------------------------------------------
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>花海记忆 - 离线模式</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      display:flex;align-items:center;justify-content:center;
      min-height:100vh;
      background:#0a0a12;color:#e8a0bf;
      font-family:"PingFang SC","Microsoft YaHei",sans-serif;
      text-align:center;
    }
    .offline-box{max-width:400px;padding:2rem}
    .offline-icon{font-size:4rem;margin-bottom:1rem}
    h1{font-size:1.6rem;margin-bottom:0.5rem}
    p{font-size:0.95rem;line-height:1.6;opacity:0.75}
    button{
      margin-top:1.5rem;padding:0.7rem 2rem;
      border:1px solid #e8a0bf;border-radius:999px;
      background:transparent;color:#e8a0bf;
      font-size:0.95rem;cursor:pointer;
      transition:background 0.3s,color 0.3s;
    }
    button:hover{background:#e8a0bf;color:#0a0a12}
  </style>
</head>
<body>
  <div class="offline-box">
    <div class="offline-icon">🌸</div>
    <h1>花海记忆</h1>
    <p>您目前处于离线状态，<br>请检查网络连接后重试。</p>
    <button onclick="location.reload()">重新加载</button>
  </div>
</body>
</html>`;

// ---------------------------------------------------------------------------
// R40 - Install: pre-cache app shell
// v1.16.0: Enable Navigation Preload for faster page loads
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// R40 - Activate: clean up old caches
// v1.16.0: Enable Navigation Preload after cleanup
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const PRELOAD_KEY = 'eb-navigation-preload';
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => {
      // Trim runtime caches to prevent unbounded growth
      return Promise.all([
        trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES),
        trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES),
      ]);
    }).then(() => {
      // v1.16.0: Enable navigation preload if supported
      if (self.registration && self.registration.navigationPreload) {
        return self.registration.navigationPreload.enable();
      }
    }).then(() => self.clients.claim())
  );
});

/**
 * Trim a cache to a maximum number of entries (FIFO eviction).
 * @param {string} cacheName
 * @param {number} maxEntries
 */
async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(toDelete.map(key => cache.delete(key)));
    }
  } catch (_) { /* cache may not exist yet */ }
}

// ---------------------------------------------------------------------------
// R40 + R42 + v1.12.0 - Fetch handler
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // --- Network-first strategy for /api/* requests ---
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // --- Cache-first for images (photos, vendor assets) ---
  if (url.pathname.startsWith('/photos/') || url.pathname.includes('/vendor/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Return a transparent 1x1 pixel for failed image requests
          if (request.destination === 'image') {
            return new Response(
              'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              { headers: { 'Content-Type': 'image/gif' } }
            );
          }
        });
      })
    );
    return;
  }

  // --- Stale-while-revalidate for CSS/JS (fast load + background update) ---
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // --- Cache-first strategy for everything else (HTML, fonts, etc.) ---
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Cache valid responses for future offline use
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        // R42: Network failed & no cache — return offline fallback page
        .catch(() => {
          if (request.mode === 'navigate' || request.destination === 'document') {
            return new Response(OFFLINE_HTML, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }
        });
    })
  );
});

// ---------------------------------------------------------------------------
// v1.12.0 - Periodic cache cleanup (runs on activate)
// ---------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
    );
  }
});
