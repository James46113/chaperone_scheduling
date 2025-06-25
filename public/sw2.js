// This is the "Offline copy of pages" service worker

const CACHE = "pwabuilder-offline";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

workbox.routing.registerRoute(
  new RegExp("/*"),//('/^((?!api).)*$'),
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