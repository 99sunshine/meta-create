import { NextRequest, NextResponse } from 'next/server'
import { isAppLocale, type AppLocale } from '@/lib/i18n'

/**
 * POST /api/ai/generate-tags
 *
 * Body: { role: string, skills: string[], interests: string[], manifesto?: string, locale?: 'en' | 'zh' }
 * Response: { tags: string[], manifesto: string, source: 'ai' | 'template' }
 *
 * Uses DeepSeek when DEEPSEEK_API_KEY is set; falls back to rule-based tags.
 * Caller should set a 15s timeout — on failure the UI shows manual input.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      role?: string
      skills?: string[]
      interests?: string[]
      manifesto?: string
      locale?: AppLocale
    }
    const { role, skills, interests, manifesto } = body
    const locale = isAppLocale(body.locale) ? body.locale : 'en'

    const apiKey = process.env.DEEPSEEK_API_KEY

    if (apiKey) {
      const prompt = locale === 'zh'
        ? `你在协助创作者完善 MetaCreate（创作者匹配平台）资料。
给定：
- 角色：${role ?? '创作者'}
- 技能：${(skills ?? []).join('、') || '未填写'}
- 兴趣：${(interests ?? []).join('、') || '未填写'}
- 宣言（可选）：${manifesto ?? ''}

请返回 JSON：
1. "tags": 3-5 个简短人格/创作风格标签
2. "manifesto": 一句有力量的话（不超过 20 个中文字符）

只返回合法 JSON，不要 markdown。`
        : `You are helping a creator build their profile on MetaCreate, a creator-matching platform.
Given:
- Role: ${role ?? 'Creator'}
- Skills: ${(skills ?? []).join(', ') || 'None listed'}
- Interests: ${(interests ?? []).join(', ') || 'None listed'}
- Manifesto (optional): ${manifesto ?? ''}

Return JSON with:
1. "tags": array of 3-5 short personality/creator-style tags (e.g. "Deep Builder", "Community Catalyst", "Rapid Prototyper", "First-Principles Thinker")
2. "manifesto": one punchy sentence (max 15 words) capturing what drives them

Respond with ONLY valid JSON. No markdown.`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 14000)

      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are a helpful assistant for creator profiles. Return only valid JSON.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        const data = await res.json() as { choices?: { message?: { content?: string } }[] }
        const raw = data?.choices?.[0]?.message?.content?.trim() ?? ''
        const parsed = JSON.parse(raw) as { tags?: string[]; manifesto?: string }
        if (parsed.tags && Array.isArray(parsed.tags)) {
          return NextResponse.json({
            tags: parsed.tags.slice(0, 5),
            manifesto: parsed.manifesto ?? '',
            source: 'ai',
          })
        }
      } catch {
        clearTimeout(timeout)
        // Fall through to template
      }
    }

    // ── Template fallback ─────────────────────────────────────────────────────
    const templateTags = generateTemplateTags(role, skills ?? [], locale)
    const templateManifesto = manifesto || generateTemplateManifesto(role, skills ?? [], locale)
    return NextResponse.json({ tags: templateTags, manifesto: templateManifesto, source: 'template' })
  } catch {
    return NextResponse.json({ error: 'Tag generation failed' }, { status: 500 })
  }
}

function generateTemplateTags(role: string | undefined, skills: string[] = [], locale: AppLocale): string[] {
  const tags: string[] = []
  const zh = locale === 'zh'

  if (role === 'Builder' || skills.some((s) => s.includes('Dev') || s.includes('Engineer'))) {
    tags.push(zh ? '深度建造者' : 'Deep Builder')
  }
  if (skills.some((s) => s.includes('AI') || s.includes('ML'))) {
    tags.push(zh ? 'AI 原生派' : 'AI-Native')
  }
  if (role === 'Visionary') tags.push(zh ? '第一性原理思考者' : 'First-Principles Thinker')
  if (role === 'Connector') tags.push(zh ? '社区催化者' : 'Community Catalyst')
  if (role === 'Strategist') tags.push(zh ? '系统思考者' : 'Systems Thinker')
  if (skills.some((s) => s.includes('Design'))) tags.push(zh ? '设计驱动者' : 'Design-Driven')
  if (skills.some((s) => s.includes('Growth') || s.includes('Market'))) tags.push(zh ? '增长黑客' : 'Growth Hacker')

  if (tags.length < 2) {
    if (zh) tags.push('快速原型实践者', '跨学科协作者')
    else tags.push('Rapid Prototyper', 'Cross-Disciplinary')
  }

  return tags.slice(0, 5)
}

function generateTemplateManifesto(role: string | undefined, skills: string[] = [], locale: AppLocale): string {
  if (locale === 'zh') {
    if (role === 'Builder') return '一次一次提交代码，打造真正解决问题的产品。'
    if (role === 'Visionary') return '把宏大想法变成能改变世界的行动。'
    if (role === 'Connector') return '连接优秀的人，一起创造任何人都无法独自完成的作品。'
    if (role === 'Strategist') return '把复杂挑战转化为清晰可执行的影响路径。'
    if (skills.some((s) => s.includes('Design'))) return '打造让人回看时觉得理所当然的体验。'
    return '在创意、技术与社群的交汇处创造价值。'
  }
  if (role === 'Builder') return 'Building products that solve real problems, one commit at a time.'
  if (role === 'Visionary') return 'Turning ambitious ideas into movements that reshape the world.'
  if (role === 'Connector') return 'Bridging brilliant people to create something none could build alone.'
  if (role === 'Strategist') return 'Turning complex challenges into clear paths to impact.'
  if (skills.some((s) => s.includes('Design'))) return 'Crafting experiences that feel inevitable in hindsight.'
  return 'Creating at the intersection of ideas, technology, and community.'
}
