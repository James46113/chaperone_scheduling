// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-page";

const offlineFallbackPage = "offline.html";
const offlineFallbackImages = ['Steel-City-Choristers.png'];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => {
        cache.add(offlineFallbackPage);
        offlineFallbackImages.forEach(image => cache.add(image));
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Ensure that the service worker takes control immediately
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;

        if (preloadResp) {
          return preloadResp;
        }

        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp || new Response('<h1>Offline page not available</h1>', {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      }
    })());
  } else if (offlineFallbackImages.includes(new URL(event.request.url).pathname.split('/').pop())) {
    event.respondWith((async () => {
      const response = await caches.match(event.request);
      return response || fetch(event.request);
    })());
  } else {
    event.respondWith((async () => {
      try {
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(event.request);
        return cachedResp || new Response('Resource not available', { status: 503 });
      }
    })());
  }
});