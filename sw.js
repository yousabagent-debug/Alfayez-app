const CACHE_NAME = 'alfayez-v10';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './db.js',
  './app.js',
  './logo.jpg',
  './icon-192.png',
  './icon-512.png'
];

// حفظ الملفات أول مرة
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// مسح أي كاش قديم
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// جلب الملفات من الكاش لو مفيش نت
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, copy);
      });
      return res;
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});
