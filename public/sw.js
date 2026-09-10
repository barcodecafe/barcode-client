/**
 * 🔔 Barcode Cafe & Restaurant - Service Worker for Web Push Notifications
 * 
 * Works even when the browser is closed or phone screen is locked!
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 📥 Receive Web Push from Server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🔔 New Notification', body: event.data.text() };
    }
  }

  const title = data.title || '🔔 New Order Received!';
  const options = {
    body: data.body || 'A new order has been placed. Click to view.',
    icon: data.icon || '/icons.png',
    badge: data.badge || '/icons.png',
    tag: data.tag || `order-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Keeps notification visible on screen
    silent: false, // Ensure system sound plays
    vibrate: [600, 250, 600, 250, 800], // Mobile strong vibration pattern
    data: {
      url: data.url || '/admin/orders',
      orderId: data.orderId || null,
      ...data,
    },
    actions: [
      { action: 'view', title: '👁️ View Order' },
      { action: 'accept', title: '✅ Accept' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 🖱️ Handle Click on Notification / Action buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin/orders';
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing window/tab is open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          if (action === 'accept' && event.notification.data?.orderId) {
            client.postMessage({
              type: 'ACCEPT_ORDER_FROM_NOTIFICATION',
              orderId: event.notification.data.orderId,
            });
          }
          return client.focus();
        }
      }

      // 2. Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
