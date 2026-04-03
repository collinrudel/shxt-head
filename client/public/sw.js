// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data,
    })
  );
});

// Notification click: open/focus the app at the room URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const roomUrl = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(roomUrl);
          return client.focus();
        }
      }
      return clients.openWindow(roomUrl);
    })
  );
});
