const CACHE_NAME = 'poop-diary-v1'

self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => { e.waitUntil(clients.claim()) })

// 接收主页面发来的消息（设置提醒时间）
self.addEventListener('message', e => {
  if (e.data?.type === 'SET_REMINDER') {
    const { time, enabled } = e.data
    if (enabled && time) {
      scheduleNextReminder(time)
    } else {
      clearReminder()
    }
  }
})

// 接收推送通知（备用，如果以后加服务端推送）
self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(showReminder(data.body || '今天还没有记录，记得拉完记一下！'))
})

// 点击通知打开页面
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})

function showReminder(body) {
  return self.registration.showNotification('拉屎日记', {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'poop-reminder',
    renotify: true
  })
}

// 计算下一次提醒的毫秒数
function msUntilTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

let reminderTimeout = null

function scheduleNextReminder(time) {
  clearReminder()
  const ms = msUntilTime(time)
  reminderTimeout = setTimeout(async () => {
    // 检查今天是否已记录（从 IndexedDB 读）
    const hasDone = await checkTodayRecord()
    if (!hasDone) {
      await showReminder('今天还没有记录，记得拉完记一下！')
    }
    // 明天同一时间再来一次
    scheduleNextReminder(time)
  }, ms)
}

function clearReminder() {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout)
    reminderTimeout = null
  }
}

async function checkTodayRecord() {
  try {
    const db = await openDB()
    const today = new Date().toISOString().slice(0, 10)
    const records = await getAllRecords(db)
    return records.some(r => r.date === today)
  } catch {
    return false
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('poop_sw_db', 1)
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('records', { keyPath: 'id' })
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}

function getAllRecords(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly')
    const req = tx.objectStore('records').getAll()
    req.onsuccess = e => resolve(e.target.result || [])
    req.onerror = reject
  })
}
