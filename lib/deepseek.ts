export async function deepseekChatJson(params: {
  system: string
  user: string
  signal?: AbortSignal
  maxTokens?: number
  temperature?: number
}): Promise<unknown> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY_MISSING')

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
      temperature: params.temperature ?? 0.6,
      max_tokens: params.maxTokens ?? 400,
      response_format: { type: 'json_object' },
    }),
    signal: params.signal,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DEEPSEEK_HTTP_${res.status}:${body}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('DEEPSEEK_EMPTY')
  return JSON.parse(content) as unknown
}

