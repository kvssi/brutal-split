/**
 * BRUTAL SPLIT - Service Worker
 * Caches the app shell for offline use.
 */

const CACHE_NAME = 'brutal-split-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.error('[SW] Cache failed:', err))
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Cache-first strategy for static assets, network-only for others
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Check if it's one of our static assets
    const isStatic = STATIC_ASSETS.some(asset => {
        // Handle relative paths vs absolute CDN paths
        if (asset.startsWith('http')) {
            return url.href === asset;
        }
        return url.pathname.endsWith(asset.replace('./', ''));
    });

    if (isStatic) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    // Optionally update cache
                    return response;
                });
            })
        );
    }
    // Note: We do NOT cache PDF data or dynamic content
});
