import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function clampText(input: string, max = 14000): string {
  const t = input.trim()
  if (t.length <= max) return t
  return t.slice(0, max)
}

type DashscopeFileUploadResponse = {
  // Flat response shape (documented format)
  id?: string
  object?: string
  status?: string
  filename?: string
  name?: string
  bytes?: number
  size?: number
  purpose?: string
  output?: { id?: string; file_id?: string }
  // Actual observed response shape from DashScope
  data?: {
    uploaded_files?: Array<{ file_id?: string; id?: string; name?: string }>
    failed_uploads?: unknown[]
  } | Array<{ id?: string; file_id?: string }>
  request_id?: string
}

type DashscopeFileGetResponse = {
  id?: string
  status?: string
  purpose?: string
  name?: string
  size?: number
}

async function getServiceSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_MISSING')
  return createAdmin(url, serviceKey, { auth: { persistSession: false } })
}

function extractJsonFromText(raw: string): unknown {
  const s = raw.trim()
  if (!s) throw new Error('QWEN_LONG_EMPTY_TEXT')
  // Strip common Markdown fences
  const unfenced = s
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
  // Try direct parse first
  try {
    return JSON.parse(unfenced)
  } catch {
    // Continue
  }
  // Find first balanced {...} block
  const start = unfenced.indexOf('{')
  if (start < 0) throw new Error('QWEN_LONG_NO_JSON_START')
  let depth = 0
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const candidate = unfenced.slice(start, i + 1)
        return JSON.parse(candidate)
      }
    }
  }
  throw new Error('QWEN_LONG_UNBALANCED_JSON')
}

async function dashscopeUploadFile(params: { bytes: ArrayBuffer; filename: string; mime: string }): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY_MISSING')

  const form = new FormData()
  form.append('file', new Blob([params.bytes], { type: params.mime }), params.filename)
  form.append('purpose', 'file-extract')

  const controller = new AbortController()
  // Uploading multi-page PDFs can be slow on serverless cold starts.
  const timeout = setTimeout(() => controller.abort(), 30000)
  const res = await fetch('https://dashscope.aliyuncs.com/api/v1/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
    signal: controller.signal,
  })
  clearTimeout(timeout)

  const bodyText = await res.text().catch(() => '')
  if (!res.ok) throw new Error(`DASHSCOPE_FILES_${res.status}:${bodyText}`)
  const json = JSON.parse(bodyText) as DashscopeFileUploadResponse

  // Actual observed shape: { data: { uploaded_files: [{ file_id, name }] }, request_id }
  const dataObj = json?.data as { uploaded_files?: Array<{ file_id?: string; id?: string }> } | undefined
  const id =
    // Primary: observed nested shape
    (Array.isArray(dataObj?.uploaded_files) && dataObj!.uploaded_files!.length > 0
      ? (dataObj!.uploaded_files![0].file_id ?? dataObj!.uploaded_files![0].id)
      : undefined) ??
    // Fallback: flat shape per docs
    json?.id ??
    json?.output?.id ??
    json?.output?.file_id ??
    // Fallback: data as array
    ((Array.isArray(json?.data) && (json!.data as Array<{ id?: string; file_id?: string }>).length > 0)
      ? ((json!.data as Array<{ id?: string; file_id?: string }>)[0].id ?? (json!.data as Array<{ id?: string; file_id?: string }>)[0].file_id)
      : undefined)

  if (!id) {
    throw new Error(`DASHSCOPE_FILE_ID_MISSING:${bodyText.slice(0, 500)}`)
  }
  return id
}

async function dashscopeWaitFileProcessed(fileId: string, totalTimeoutMs = 15000): Promise<void> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY_MISSING')
  const deadline = Date.now() + totalTimeoutMs
  let lastStatus = ''
  let lastBody = ''
  let backoffMs = 900
  while (Date.now() < deadline) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`https://dashscope.aliyuncs.com/api/v1/files/${encodeURIComponent(fileId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    })
      .catch((e) => {
        lastBody = e instanceof Error ? e.message : String(e)
        return null
      })
      .finally(() => clearTimeout(timeout))

    if (!res) {
      await sleep(backoffMs)
      backoffMs = Math.min(Math.floor(backoffMs * 1.4), 5000)
      continue
    }

    const text = await res.text().catch(() => '')
    lastBody = text.slice(0, 500)

    // Some accounts/regions may briefly return 404/409 while the file metadata propagates.
    if (!res.ok) {
      if (res.status === 404 || res.status === 409 || res.status >= 500) {
        await sleep(backoffMs)
        backoffMs = Math.min(Math.floor(backoffMs * 1.4), 5000)
        continue
      }
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after') ?? '')
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(backoffMs * 2, 8000)
        await sleep(waitMs)
        backoffMs = Math.min(Math.floor(backoffMs * 1.6), 8000)
        continue
      }
      throw new Error(`DASHSCOPE_FILE_GET_${res.status}:${text}`)
    }

    const json = JSON.parse(text) as DashscopeFileGetResponse
    const status = String(json?.status ?? '').toLowerCase()
    lastStatus = status
    if (status === 'processed' || status === 'succeeded' || status === 'success') return
    // Avoid tight polling; rate limits are easy to hit.
    await sleep(1500)
  }
  throw new Error(`DASHSCOPE_FILE_PROCESS_TIMEOUT:last_status=${lastStatus || 'unknown'}:last_body=${lastBody}`)
}

async function dashscopeDeleteFile(fileId: string): Promise<void> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) return
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  await fetch(`https://dashscope.aliyuncs.com/api/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: controller.signal,
  }).catch(() => {}).finally(() => clearTimeout(timeout))
}

async function dashscopeQwenLongExtractJson(fileId: string, totalTimeoutMs = 20000): Promise<unknown> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY_MISSING')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), totalTimeoutMs)
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-long',
        input: {
          messages: [
            {
              role: 'system',
              content:
                '你是一个简历解析专家。请从提供的文档中提取信息并仅输出 JSON（不要包含任何解释文字或 Markdown）。' +
                '重要：name 与 city 只有在高度确定时才返回，否则返回 null；不要猜测。' +
                'skills 必须从给定技能池中选择；interests 必须从给定兴趣池中选择。',
            },
            { role: 'system', content: `fileid://${fileId}` },
            {
              role: 'user',
              content:
                `技能池：${SKILLS.join(', ')}\n` +
                `兴趣池：${INTERESTS_POOL.join(', ')}\n` +
                '输出 JSON schema：' +
                '{ "name": string|null, "city": string|null, "skills": string[], "interests": string[], "school": string|null, "summary": string|null }',
            },
          ],
        },
        parameters: { result_format: 'message' },
      }),
      signal: controller.signal,
    })

    const text = await res.text().catch(() => '')
    if (!res.ok) throw new Error(`DASHSCOPE_QWEN_${res.status}:${text}`)
    const json = JSON.parse(text) as any
    const content = json?.output?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) throw new Error('DASHSCOPE_QWEN_EMPTY')
    // qwen-long returns a string; extract JSON robustly.
    return extractJsonFromText(content)
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const bucket = String((body as any)?.bucket ?? 'resumes')
    const filePath = String((body as any)?.filePath ?? '')
    if (!filePath) return NextResponse.json({ error: 'Missing filePath' }, { status: 400 })
    if (bucket !== 'resumes') return NextResponse.json({ error: 'Unsupported bucket' }, { status: 400 })

    // Create signed URL (private bucket)
    const admin = await getServiceSupabase()
    const { data: signed, error: signErr } = await admin.storage
      .from(bucket)
      .createSignedUrl(filePath, 300)
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: signErr?.message ?? 'Failed to sign url' }, { status: 500 })
    }

    // Download resume bytes from signed URL
    const fileController = new AbortController()
    const fileTimeout = setTimeout(() => fileController.abort(), 30000)
    const fileRes = await fetch(signed.signedUrl, { signal: fileController.signal })
    clearTimeout(fileTimeout)
    if (!fileRes.ok) {
      const t = await fileRes.text().catch(() => '')
      return NextResponse.json({ error: `RESUME_FETCH_${fileRes.status}:${t}` }, { status: 500 })
    }
    const bytes = await fileRes.arrayBuffer()
    const filename = filePath.split('/').pop() ?? 'resume'
    const mime = fileRes.headers.get('content-type') ?? 'application/octet-stream'

    // Upload to DashScope files, call qwen-long to extract JSON, then cleanup
    let dashFileId: string | null = null
    try {
      dashFileId = await dashscopeUploadFile({ bytes, filename, mime }).catch((e) => {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`STAGE_FILES_UPLOAD:${msg}`)
      })
      await dashscopeWaitFileProcessed(dashFileId, 60000).catch((e) => {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`STAGE_FILES_PROCESS:${msg}`)
      })
      const extracted = (await dashscopeQwenLongExtractJson(dashFileId, 60000).catch((e) => {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`STAGE_QWEN_LONG:${msg}`)
      })) as Partial<ParseResumeResult>

      const skills = (extracted.skills ?? [])
        .map((s) => normalizeSkill(String(s)))
        .filter((s) => SKILLS.includes(s))
        .slice(0, 8)
      const interests = (extracted.interests ?? [])
        .map((s) => String(s))
        .filter((s) => INTERESTS_POOL.includes(s as (typeof INTERESTS_POOL)[number]))
        .slice(0, 6)

      const result: ParseResumeResult = {
        name: extracted.name ? String(extracted.name).slice(0, 100) : null,
        city: extracted.city ? String(extracted.city).slice(0, 100) : null,
        skills,
        interests,
        school: extracted.school ? String(extracted.school).slice(0, 200) : null,
        summary: extracted.summary ? String(extracted.summary).slice(0, 80) : null,
      }

      return NextResponse.json({ result, source: 'qwen-long' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'RESUME_AI_PARSE_FAILED'
      return NextResponse.json({
        result: { skills: [], interests: [] } satisfies ParseResumeResult,
        source: 'fallback',
        error: msg,
      })
    } finally {
      if (dashFileId) await dashscopeDeleteFile(dashFileId)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

