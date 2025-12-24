/*Klasse für den Service Worker (in den DevTools unter Application → Service Workers zu sehen)
einfach wieder auskommentieren und speichern, um den Service Worker zu aktivieren.*/








const CACHE_NAME = 'angel-app-v2';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './app.js',
        './manifest.json',
        './data/fische.json'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});




