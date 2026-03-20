
// Service Worker for صيانة بلس
const CACHE_NAME = 'medical-maintenance-v1';

// يتم استدعاؤه عند التثبيت
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// يتم استدعاؤه عند التفعيل
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// الحدث الأهم لتفعيل ميزة التثبيت كتطبيق (Installable App)
self.addEventListener('fetch', (event) => {
  // هذا المستمع فارغ ولكنه ضروري لكي يوافق متصفح Chrome على تثبيت الموقع كتطبيق
  event.respondWith(fetch(event.request).catch(() => {
    return caches.match(event.request);
  }));
});
