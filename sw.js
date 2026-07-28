self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('music-cloud-cache-v2').then((cache) => {
      return cache.addAll([
        './index.html',
        './Styles.css',
        './Script.js',
        './data.js',
        './data2.js',
        './1.gif',
        './2.gif',
        './3.gif',
        './icono.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
