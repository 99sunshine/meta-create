import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'
import type { Json } from '@/types/supabase'

/**
 * POST /api/analytics
 * Body: { name: string; properties?: Record<string, unknown> }
 *
 * Writes to analytics_events table server-side (avoids RLS issues with anon writes).
 * user_id is resolved from the server session — never trusted from the client body.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, properties } = await req.json()
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid event name' }, { status: 400 })
    }

    // Sanitise: properties must not contain PII fields
    const safeProperties = sanitiseProperties(properties)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('analytics_events').insert({
      event_name: name,
      properties: safeProperties as Json,
      user_id: user?.id ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never return 5xx to clients — analytics failures are silent
    return NextResponse.json({ ok: false })
  }
}

const PII_KEYS = new Set(['email', 'password', 'phone', 'name', 'address'])

function sanitiseProperties(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!PII_KEYS.has(k.toLowerCase())) {
      out[k] = v
    }
  }
  return out
}
