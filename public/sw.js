// مستقبل الخدمة (Service Worker) لتفعيل قابلية التثبيت كـ PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// هذا المستمع ضروري جداً لمتصفح Chrome ليعتبر الموقع "تطبيقاً" قابلاً للتثبيت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
