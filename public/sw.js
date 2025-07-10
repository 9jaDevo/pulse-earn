// Service Worker for PollPeak PWA

const CACHE_NAME = 'pollpeak-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/PollPeak.png',
  '/assets/favicon.ico',
  '/assets/favicon-16x16.png',
  '/assets/favicon-32x32.png',
  '/assets/apple-touch-icon.png',
  '/assets/icons/icon-48x48.webp',
  '/assets/icons/icon-72x72.webp',
  '/assets/icons/icon-96x96.webp',
  '/assets/icons/icon-128x128.webp',
  '/assets/icons/icon-144x144.webp',
  '/assets/icons/icon-152x152.webp',
  '/assets/icons/icon-192x192.webp',
  '/assets/icons/icon-256x256.webp',
  '/assets/icons/icon-384x384.webp',
  '/assets/icons/icon-512x512.webp'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip Supabase API requests
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Make network request
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});