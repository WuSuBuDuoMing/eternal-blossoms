/**
 * Service Worker - Eternal Blossoms PWA
 * R40: Cache strategies (cache-first for static, network-first for API)
 * R42: Offline fallback with embedded HTML page
 */

const VERSION = '1.0.0';
const CACHE_NAME = `eternal-blossoms-v${VERSION}`;

// Static assets to pre-cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/layouts.js',
  '/js/particles.js',
  '/js/scene.js',
  '/js/ui.js',
  '/data/cards.json'
];

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
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// R40 + R42 - Fetch handler
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // --- Network-first strategy for /api/* requests ---
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // --- Cache-first strategy for everything else (static assets) ---
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
