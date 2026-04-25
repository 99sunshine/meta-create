import { NextRequest, NextResponse } from 'next/server'
import { generateIceBreaker, type IceBreakerParams } from '@/lib/icebreaker'
import { deepseekChatJson } from '@/lib/deepseek'

/**
 * POST /api/ai/icebreaker
 *
 * Request body: IceBreakerParams
 * Response:     { text: string }
 *
 * Uses DeepSeek (deepseek-chat) when DEEPSEEK_API_KEY is set; falls back to local templates.
 */
export async function POST(req: NextRequest) {
  try {
    const params: IceBreakerParams = await req.json()

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (apiKey) {
      const senderSkills = (params.senderSkills ?? []).slice(0, 8).join('、')
      const receiverSkills = (params.receiverSkills ?? []).slice(0, 8).join('、')
      const senderManifesto = (params.senderManifesto ?? '').slice(0, 160)
      const receiverManifesto = (params.receiverManifesto ?? '').slice(0, 160)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const json = await deepseekChatJson({
          system:
            '你在为创作者匹配平台 MetaCreate 生成「右滑后静默发送」的破冰消息。' +
            '要求：中文、真诚但不油腻、1-2 句、<= 70 字，避免夸张与套话。' +
            '必须包含至少 1 个具体点（共同技能/同赛道/对方 manifesto 关键词之一）。' +
            '不要出现”作为AI/我无法”之类字样。只输出 JSON。',
          user:
            `发送方：${params.senderName}（角色：${params.senderRole ?? '未知'}；赛道：${params.senderTrack ?? '未选'}；技能：${senderSkills || '未填'}；manifesto：${senderManifesto || '未填'}）\n` +
            `接收方：${params.receiverName}（角色：${params.receiverRole ?? '未知'}；赛道：${params.receiverTrack ?? '未选'}；技能：${receiverSkills || '未填'}；manifesto：${receiverManifesto || '未填'}）\n` +
            `请求类型：${params.type ?? 'just_connect'}\n\n` +
            '输出 JSON：{ “text”: string }',
          maxTokens: 160,
          temperature: 0.8,
          signal: controller.signal,
        })

        const text = (json as { text?: string })?.text?.trim()
        if (text) return NextResponse.json({ text, source: 'ai' })
      } finally {
        clearTimeout(timeout)
      }
    }

    // ── Fallback: local template ─────────────────────────────────────────────
    const text = generateIceBreaker(params)
    return NextResponse.json({ text, source: 'template' })
  } catch {
    return NextResponse.json({ error: 'Failed to generate ice-breaker' }, { status: 500 })
  }
}
