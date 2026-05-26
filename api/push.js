import webpush from 'web-push'
import { Redis } from '@upstash/redis'

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com'

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const path = req.url.split('/api/push/')[1]?.split('?')[0]

  // 获取 VAPID 公钥
  if (req.method === 'GET' && path === 'vapid') {
    return res.status(200).json({ publicKey: VAPID_PUBLIC })
  }

  // 保存推送订阅
  if (req.method === 'POST' && path === 'subscribe') {
    const { subscription, reminderTime, userId } = req.body
    if (!subscription) return res.status(400).json({ error: '缺少订阅信息' })
    const redis = getRedis()
    await redis.set(`sub:${userId}`, JSON.stringify({ subscription, reminderTime, userId }))
    return res.status(200).json({ success: true })
  }

  // 发送推送
  if (req.method === 'POST' && path === 'send') {
    const secret = req.headers['x-cron-secret']
    if (secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
    const redis = getRedis()

    const now = new Date()
    const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

    const keys = await redis.keys('sub:*')
    let sent = 0
    for (const key of keys) {
      const raw = await redis.get(key)
      if (!raw) continue
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (data.reminderTime !== hm) continue
      try {
        await webpush.sendNotification(data.subscription, JSON.stringify({
          title: '拉屎日记',
          body: '今天还没有记录，记得拉完记一下！'
        }))
        sent++
      } catch(e) {
        if (e.statusCode === 410) await redis.del(key)
      }
    }
    return res.status(200).json({ sent })
  }

  return res.status(404).json({ error: 'Not found' })
}
