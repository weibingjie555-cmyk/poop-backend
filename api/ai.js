export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, max_tokens = 800 } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 参数缺失' })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: '服务未配置' })
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens,
        messages
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: 'AI 服务异常', detail: err })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (err) {
    console.error('AI proxy error:', err)
    return res.status(500).json({ error: err.message })
  }
}
