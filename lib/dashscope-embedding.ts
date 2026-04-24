export type DashscopeEmbeddingResult = {
  embedding: number[]
  model: string
}

export async function embedTextDashscope(params: {
  input: string
  signal?: AbortSignal
}): Promise<DashscopeEmbeddingResult> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY_MISSING')

  const res = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-v3',
        input: { texts: [params.input] },
      }),
      signal: params.signal,
    },
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DASHSCOPE_HTTP_${res.status}:${body}`)
  }

  const json = (await res.json()) as {
    output?: { embeddings?: Array<{ embedding?: number[] }> }
    usage?: unknown
    request_id?: string
  }

  const embedding = json?.output?.embeddings?.[0]?.embedding
  if (!Array.isArray(embedding)) throw new Error('DASHSCOPE_BAD_RESPONSE')
  if (embedding.length !== 1024) throw new Error(`DASHSCOPE_DIM_${embedding.length}`)

  return { embedding, model: 'text-embedding-v3' }
}

