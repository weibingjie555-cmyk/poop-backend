export const config = { runtime: 'edge' }

export default async function handler(req) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // 跨域头（允许你的前端域名访问）
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  // 处理 preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers })
  }

  try {
    const body = await req.json()
    const { messages, max_tokens = 800 } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages 参数缺失' }), { status: 400, headers })
    }

    // 从 Vercel 环境变量取 Key，不暴露给前端
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务未配置' }), { status: 500, headers })
    }

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
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

    if (!resp.ok) {
      const err = await resp.text()
      return new Response(JSON.stringify({ error: 'AI 服务异常', detail: err }), { status: resp.status, headers })
    }

    const data = await resp.json()
    return new Response(JSON.stringify(data), { status: 200, headers })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers })
  }
}
