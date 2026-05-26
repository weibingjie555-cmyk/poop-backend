// 定时任务 - 每分钟触发，检查并发送提醒
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Vercel Cron 验证
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 调用推送接口
  const baseUrl = `https://${req.headers.host}`
  const resp = await fetch(`${baseUrl}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET
    }
  })
  const result = await resp.json()
  return res.status(200).json(result)
}
