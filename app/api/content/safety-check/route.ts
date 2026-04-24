import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'
import { ContentSafetyError, assertSafeTextWithAi } from '@/lib/content-safety'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const text = typeof (body as any)?.text === 'string' ? (body as any).text : ''
    const fieldLabel = typeof (body as any)?.fieldLabel === 'string' ? (body as any).fieldLabel : '内容'

    await assertSafeTextWithAi(text, fieldLabel)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ContentSafetyError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

