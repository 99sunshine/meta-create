import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'
import { profileUpdateSchema } from '@/schemas/profile'
import { embedTextDashscope } from '@/lib/dashscope-embedding'
import { ContentSafetyError, assertSafeTextWithAi } from '@/lib/content-safety'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const updates = profileUpdateSchema.parse(body)
    await assertSafeTextWithAi((updates as { manifesto?: string | null }).manifesto, 'Manifesto')

    // 1) Update profile first (never block on embedding)
    const { data: updated, error: upErr } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .single()

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    // 2) Best-effort embedding when manifesto is present
    const manifesto = (updated as { manifesto?: string | null })?.manifesto ?? null
    if (manifesto && manifesto.trim().length > 0) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 9000)
      try {
        const { embedding } = await embedTextDashscope({ input: manifesto.slice(0, 800), signal: controller.signal })
        // Note: pgvector accepts text like "[1,2,3]" or "(1,2,3)" depending on adapter.
        // We store as string to let PostgREST cast to vector.
        const vectorText = `[${embedding.join(',')}]`
        // Supabase generated Database types may not include the new pgvector columns yet.
        // Cast to any to avoid blocking compilation before migrations/types are updated.
        await (supabase as any)
          .from('profiles')
          .update({
            manifesto_embedding: vectorText,
            manifesto_embedding_updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      } catch {
        // ignore: vision score will fall back to neutral until cron fills
      } finally {
        clearTimeout(timeout)
      }
    }

    return NextResponse.json({ profile: updated })
  } catch (e) {
    if (e instanceof ContentSafetyError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

