import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'
import { deepseekChatJson } from '@/lib/deepseek'
import { SKILLS, normalizeSkill } from '@/constants/skills'
import { INTERESTS_POOL } from '@/constants/enums'

type ParseResumeResult = {
  name?: string | null
  city?: string | null
  skills: string[]
  interests: string[]
  school?: string | null
  summary?: string | null
}

function clampText(input: string, max = 14000): string {
  const t = input.trim()
  if (t.length <= max) return t
  return t.slice(0, max)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const textRaw = typeof (body as { text?: unknown }).text === 'string' ? (body as { text: string }).text : ''
    const text = clampText(textRaw, 14000)
    if (!text) {
      return NextResponse.json({ result: { skills: [], interests: [] } satisfies ParseResumeResult, source: 'empty' })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const json = await deepseekChatJson({
        system:
          '你是一个简历解析器。只输出 JSON，不要输出任何解释文字。' +
          '目标：从简历文本中提取信息（用于创作者匹配平台 MetaCreate 的 onboarding 预填）。' +
          '重要：name 与 city 只有在高度确定时才返回，否则返回 null；不要猜测。' +
          'skills 只能从给定技能池中选择；interests 只能从给定兴趣池中选择。',
        user:
          `技能池(从中选择，允许少量为空)：\n${SKILLS.join(', ')}\n\n` +
          `兴趣池(从中选择，允许少量为空)：\n${INTERESTS_POOL.join(', ')}\n\n` +
          `请从下方简历文本中抽取：\n` +
          `- name: 姓名（可选；只在非常确定时填写，否则 null）\n` +
          `- city: 城市（可选；只在非常确定时填写，否则 null）\n` +
          `- skills: 最多 8 个\n` +
          `- interests: 最多 6 个\n` +
          `- school: 一句话（可选）\n` +
          `- summary: 1 句中文（<= 20 字），作为 manifesto 建议（可选）\n\n` +
          `输出 JSON schema:\n` +
          `{ "name": string|null, "city": string|null, "skills": string[], "interests": string[], "school": string|null, "summary": string|null }\n\n` +
          `简历文本:\n${text}`,
        signal: controller.signal,
        maxTokens: 450,
        temperature: 0.2,
      })

      const parsed = json as Partial<ParseResumeResult>
      const skills = (parsed.skills ?? [])
        .map((s) => normalizeSkill(String(s)))
        .filter((s) => SKILLS.includes(s))
        .slice(0, 8)
      const interests = (parsed.interests ?? [])
        .map((s) => String(s))
        .filter((s) => INTERESTS_POOL.includes(s as (typeof INTERESTS_POOL)[number]))
        .slice(0, 6)

      const result: ParseResumeResult = {
        name: parsed.name ? String(parsed.name).slice(0, 100) : null,
        city: parsed.city ? String(parsed.city).slice(0, 100) : null,
        skills,
        interests,
        school: parsed.school ? String(parsed.school).slice(0, 200) : null,
        summary: parsed.summary ? String(parsed.summary).slice(0, 80) : null,
      }

      return NextResponse.json({ result, source: 'ai' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'RESUME_AI_PARSE_FAILED'
      return NextResponse.json({
        result: { skills: [], interests: [] } satisfies ParseResumeResult,
        source: 'fallback',
        error: msg,
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

