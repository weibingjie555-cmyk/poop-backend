// Service Worker - 处理推送通知和离线缓存
const CACHE_NAME = 'poop-diary-v1'

// 安装
self.addEventListener('install', e => {
  self.skipWaiting()
})

// 激活
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

// 接收推送通知
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  const title = data.title || '拉屎日记'
  const options = {
    body: data.body || '今天还没有记录，记得拉完记一下！',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'poop-reminder',
    renotify: true,
    data: { url: data.url || '/' }
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// 点击通知跳转
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const client of list) {
        if (client.url === '/' && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
