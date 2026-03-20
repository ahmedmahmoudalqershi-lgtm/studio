
// Service Worker بسيط ولكنه يحتوي على مستمع للأحداث fetch وهو شرط أساسي لتثبيت التطبيق (WebAPK)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});

// هذا المستمع هو السر التقني لجعل متصفح Chrome يظهر خيار "تثبيت التطبيق"
self.addEventListener('fetch', (event) => {
  // يمكن ترك هذا فارغاً أو استخدامه للكاش، المهم وجوده لتفعيل معايير PWA
});
