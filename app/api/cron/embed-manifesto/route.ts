import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { embedTextDashscope } from '@/lib/dashscope-embedding'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('x-cron-secret') === secret
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const supabase = createAdmin(url, serviceKey, { auth: { persistSession: false } })

  // Scan a small batch each run to avoid timeouts
  const { data: rows, error } = await supabase
    .from('profiles')
    .select('id, manifesto, manifesto_embedding_updated_at, updated_at')
    .not('manifesto', 'is', null)
    .or('manifesto_embedding.is.null,manifesto_embedding_updated_at.lt.updated_at')
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0
  for (const r of rows ?? []) {
    const manifesto = (r as { manifesto?: string | null }).manifesto
    if (!manifesto?.trim()) continue

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)
    try {
      const { embedding } = await embedTextDashscope({ input: manifesto.slice(0, 800), signal: controller.signal })
      const vectorText = `[${embedding.join(',')}]`
      const { error: upErr } = await (supabase as any)
        .from('profiles')
        .update({
          manifesto_embedding: vectorText,
          manifesto_embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', (r as { id: string }).id)
      if (!upErr) updated += 1
    } catch {
      // keep going
    } finally {
      clearTimeout(timeout)
    }
  }

  return NextResponse.json({ scanned: rows?.length ?? 0, updated })
}

