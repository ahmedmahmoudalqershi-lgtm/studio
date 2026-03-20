
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // هذا المستمع ضروري جداً لكي يعتبر متصفح Chrome الموقع "تطبيقاً حقيقياً" (PWA)
  // يسمح للتطبيق بالعمل حتى في حالة ضعف الشبكة أو انقطاعها
  event.respondWith(fetch(event.request));
});
