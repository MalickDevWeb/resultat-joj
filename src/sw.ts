/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Nettoyer les anciens caches générés par Workbox
cleanupOutdatedCaches();

// Precaching automatique de tous les assets (JS, CSS, HTML) gérés par VitePWA
precacheAndRoute(self.__WB_MANIFEST);

// ---- STRATÉGIE POUR LES ASSETS STATIQUES ----
// (Images, polices, icônes)
registerRoute(
  // Seulement les ressources du site : les drapeaux (flagcdn) et les polices (Google) se chargent directement,
  // sinon le service worker les relirait avec fetch, que la CSP (connect-src) bloque.
  ({ request, url }) => url.origin === self.location.origin && (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/')),
  new CacheFirst({
    cacheName: 'pwa-assets-v1',
  })
);

// ---- STRATÉGIE POUR LES PAGES HTML (SPA) ----
registerRoute(
  ({ request }) => request.mode === 'navigate' || request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pwa-pages-v1',
  })
);

// ---- PUSH NOTIFICATIONS ----
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification PWA';
  const options = {
    body: data.body || 'Nouvelle notification.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    // Seulement une page du site lui-même (« /… ») : jamais une adresse d'un autre site.
    data: typeof data.url === 'string' && /^\/(?![/\\])/.test(data.url) ? data.url : '/',
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Ignorer' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(self.clients.openWindow(event.notification.data || '/'));
  }
});

// ---- BACKGROUND SYNC ----
self.addEventListener('sync', (event: Event & { tag?: string }) => {
  console.log('[SW] Background Sync déclenché :', event.tag);
});
