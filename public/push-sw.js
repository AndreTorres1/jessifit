/* Handler de notificações push — importado pelo service worker gerado. */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'JessiFit', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'JessiFit'
  const options = {
    body: data.body || 'Tens novidades no teu treino.',
    icon: '/jessifit/pwa-192.png',
    badge: '/jessifit/pwa-192.png',
    data: { url: data.url || '/jessifit/' },
    vibrate: [60, 30, 60],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/jessifit/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
