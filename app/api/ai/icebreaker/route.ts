import { NextRequest, NextResponse } from 'next/server'
import { generateIceBreaker, type IceBreakerParams } from '@/lib/icebreaker'

/**
 * POST /api/ai/icebreaker
 *
 * Request body: IceBreakerParams
 * Response:     { text: string }
 *
 * Currently returns a template stub.
 * To enable AI, set DEEPSEEK_API_KEY (or OPENAI_API_KEY) in your environment
 * and uncomment the DeepSeek / OpenAI section below.
 */
export async function POST(req: NextRequest) {
  try {
    const params: IceBreakerParams = await req.json()

    // ── AI path (DeepSeek / OpenAI) ──────────────────────────────────────────
    // Uncomment when API key is available:
    //
    // const apiKey = process.env.DEEPSEEK_API_KEY
    // if (apiKey) {
    //   const res = await fetch('https://api.deepseek.com/chat/completions', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    //     body: JSON.stringify({
    //       model: 'deepseek-chat',
    //       messages: [
    //         { role: 'system', content: 'You generate short, warm, personalized professional ice-breaker messages for a creator-matching platform called MetaCreate. Be concise (2-3 sentences), genuine, and specific to the roles and context.' },
    //         { role: 'user', content: `Write an ice-breaker from ${params.senderName} (${params.senderRole ?? 'creator'}) to ${params.receiverName} (${params.receiverRole ?? 'creator'}). Request type: ${params.type ?? 'just_connect'}.` },
    //       ],
    //       temperature: 0.8,
    //       max_tokens: 120,
    //     }),
    //   })
    //   const data = await res.json()
    //   const text: string = data?.choices?.[0]?.message?.content?.trim()
    //   if (text) return NextResponse.json({ text, source: 'ai' })
    // }

    // ── Fallback: local template ─────────────────────────────────────────────
    const text = generateIceBreaker(params)
    return NextResponse.json({ text, source: 'template' })
  } catch {
    return NextResponse.json({ error: 'Failed to generate ice-breaker' }, { status: 500 })
  }
}
