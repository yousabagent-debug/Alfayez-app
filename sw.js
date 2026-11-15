// Service Worker مؤقت - بدون كاش
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // لا تفعل شيئاً، دع المتصفح يجيب كل حاجة من النت مباشرة
});
