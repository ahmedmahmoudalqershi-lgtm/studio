
// Service Worker ضروري لتفعيل ميزة تثبيت التطبيق (WebAPK)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// هذا المستمع ضروري جداً لمتصفح كروم لكي يعتبر الموقع تطبيقاً حقيقياً
self.addEventListener('fetch', (event) => {
  // يمكن إضافة استراتيجيات التخزين المؤقت هنا لاحقاً
});
