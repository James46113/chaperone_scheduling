// This is the "Offline copy of pages" service worker

const CACHE = "pwabuilder-offline";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

workbox.routing.registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/public/')) return false;
    return true;
  },
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE
  })
);

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", {
      body: data.body || "Default body",
      icon: "/favicon.png",
      data: data,
      requireInteraction: true,
      actions: data.actions || [],
      tag: data.tag || undefined,
      renotify: data.renotify || false,
      silent: data.silent || false,
      badge: data.badge || undefined,
      image: data.image || undefined,
      vibrate: data.vibrate || undefined,
      timestamp: data.timestamp || Date.now(),
      url: data.url || "/"
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || event.notification.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if there's already a window/tab open
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Focus existing window and navigate to the URL
          client.focus();
          return client.navigate(urlToOpen);
        }
      }

      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});