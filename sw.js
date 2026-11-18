const CACHE_NAME = 'alfayez-v102';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './db.js',
  './login.js',
  './settings.js',
  './branches.js',
  './app.js',
  './logo.jpg',
  './icon-192.png',
  './icon-512.png',
  './pages/dashboard.js',
  './pages/goods.js',
  './pages/shifts.js',
  './pages/invoice.js',
  './pages/supplies.js',
  './pages/expenses.js',
  './pages/reports.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
