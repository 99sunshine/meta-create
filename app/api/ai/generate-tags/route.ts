import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ai/generate-tags
 *
 * Body: { role: string, skills: string[], interests: string[], manifesto?: string }
 * Response: { tags: string[], manifesto: string, source: 'ai' | 'template' }
 *
 * Uses DeepSeek when DEEPSEEK_API_KEY is set; falls back to rule-based tags.
 * Caller should set a 15s timeout — on failure the UI shows manual input.
 */
export async function POST(req: NextRequest) {
  try {
    const { role, skills, interests, manifesto } = await req.json() as {
      role?: string
      skills?: string[]
      interests?: string[]
      manifesto?: string
    }

    const apiKey = process.env.DEEPSEEK_API_KEY

    if (apiKey) {
      const prompt = `You are helping a creator build their profile on MetaCreate, a creator-matching platform.
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
    const templateTags = generateTemplateTags(role, skills ?? [])
    const templateManifesto = manifesto || generateTemplateManifesto(role, skills ?? [])
    return NextResponse.json({ tags: templateTags, manifesto: templateManifesto, source: 'template' })
  } catch {
    return NextResponse.json({ error: 'Tag generation failed' }, { status: 500 })
  }
}

function generateTemplateTags(role?: string, skills: string[] = []): string[] {
  const tags: string[] = []

  if (role === 'Builder' || skills.some((s) => s.includes('Dev') || s.includes('Engineer'))) {
    tags.push('Deep Builder')
  }
  if (skills.some((s) => s.includes('AI') || s.includes('ML'))) {
    tags.push('AI-Native')
  }
  if (role === 'Visionary') tags.push('First-Principles Thinker')
  if (role === 'Connector') tags.push('Community Catalyst')
  if (role === 'Strategist') tags.push('Systems Thinker')
  if (skills.some((s) => s.includes('Design'))) tags.push('Design-Driven')
  if (skills.some((s) => s.includes('Growth') || s.includes('Market'))) tags.push('Growth Hacker')

  if (tags.length < 2) tags.push('Rapid Prototyper', 'Cross-Disciplinary')

  return tags.slice(0, 5)
}

function generateTemplateManifesto(role?: string, skills: string[] = []): string {
  if (role === 'Builder') return 'Building products that solve real problems, one commit at a time.'
  if (role === 'Visionary') return 'Turning ambitious ideas into movements that reshape the world.'
  if (role === 'Connector') return 'Bridging brilliant people to create something none could build alone.'
  if (role === 'Strategist') return 'Turning complex challenges into clear paths to impact.'
  if (skills.some((s) => s.includes('Design'))) return 'Crafting experiences that feel inevitable in hindsight.'
  return 'Creating at the intersection of ideas, technology, and community.'
}
