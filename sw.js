// Service Worker für GitHub Pages (HTTPS erforderlich)
// Funktioniert NUR auf HTTPS (GitHub Pages hat HTTPS)

const CACHE_NAME = 'brutal-split-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js'
];

// Install: Assets cachen
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Fetch: Aus Cache oder Network
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});

// Activate: Alte Caches löschen
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});
