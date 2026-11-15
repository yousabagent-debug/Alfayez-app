const CACHE_NAME = 'alfayez-v5';

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
  './icon-512.png'
];

// حفظ الملفات أول مرة
self.addEventListener('install', (e) => {
  self.skipWaiting(); // عشان النسخة الجديدة تشتغل فوراً
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
  self.clients.claim(); // عشان نسيطر على كل الصفحات المفتوحة
});

// استراتيجية الجلب: Network First (النت الأول، ولو مفيش نت نستخدم الكاش)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((res) => {
      // لو جبنا الملف من النت، بنحدث الكاش بيه
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, copy);
      });
      return res;
    }).catch(() => {
      // لو مفيش نت، بنجيب من الكاش
      return caches.match(e.request);
    })
  );
});
