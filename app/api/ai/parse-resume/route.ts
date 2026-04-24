import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { deepseekChatJson } from '@/lib/deepseek'
import { SKILLS, normalizeSkill } from '@/constants/skills'
import { INTERESTS_POOL } from '@/constants/enums'
import { createRequire } from 'node:module'

export const runtime = 'nodejs'

type ParseResumeResult = {
  /**
   * Only return when highly confident; otherwise null.
   * Avoid guessing from email handles or headers without clear naming.
   */
  name?: string | null
  /**
   * Only return when highly confident; otherwise null.
   * Prefer a real city (e.g. "Beijing") over generic regions.
   */
  city?: string | null
  skills: string[]
  interests: string[]
  school?: string | null
  summary?: string | null
}

function clampText(input: string, max = 12000): string {
  const t = input.trim()
  if (t.length <= max) return t
  return t.slice(0, max)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const mime = file.type

    let text = ''
    try {
      if (mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Next/webpack can wrap CJS in various shapes; use require for stability.
        const req = createRequire(import.meta.url)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = req('pdf-parse') as unknown
        const fn =
          typeof pdfParse === 'function'
            ? pdfParse
            : typeof (pdfParse as { default?: unknown })?.default === 'function'
              ? (pdfParse as { default: (b: Buffer) => Promise<{ text?: string }> }).default
              : null
        if (!fn) throw new Error('PDF_PARSE_IMPORT_FAILED')
        const out = await fn(buf)
        text = out.text ?? ''
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || file.name.toLowerCase().endsWith('.docx')
      ) {
        const mammoth = await import('mammoth')
        const extractRawText = (mammoth as unknown as { extractRawText?: unknown }).extractRawText
        if (typeof extractRawText !== 'function') throw new Error('MAMMOTH_IMPORT_FAILED')
        const out = await (extractRawText as (arg: { buffer: Buffer }) => Promise<{ value?: string }>)({ buffer: buf })
        text = out.value ?? ''
      } else {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'RESUME_TEXT_EXTRACT_FAILED'
      return NextResponse.json({ error: msg, source: 'extract' }, { status: 400 })
    }

    text = clampText(text, 14000)
    if (!text) return NextResponse.json({ result: { skills: [], interests: [] } satisfies ParseResumeResult, source: 'empty' })

    // Store file (private bucket) — best-effort
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && serviceKey) {
      const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } })
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`.slice(0, 180)
      await admin.storage.from('resumes').upload(path, buf, { contentType: mime || 'application/octet-stream', upsert: false }).catch(() => {})
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const json = await deepseekChatJson({
        system:
          '你是一个简历解析器。只输出 JSON，不要输出任何解释文字。' +
          '目标：从简历文本中提取信息（用于创作者匹配平台 MetaCreate 的 onboarding 预填）。' +
          'skills 只能从给定技能池中选择；interests 只能从给定兴趣池中选择。',
        user:
          `技能池(从中选择，允许少量为空)：\n${SKILLS.join(', ')}\n\n` +
          `兴趣池(从中选择，允许少量为空)：\n${INTERESTS_POOL.join(', ')}\n\n` +
          `请从下方简历文本中抽取：\n` +
          `- name: 姓名\n` +
          `- city: 城市\n` +
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

