import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'

/**
 * GET /api/match?limit=60
 *
 * Calls the plpgsql get_matched_creators() function on Supabase.
 * Falls back to a simple created_at ORDER if the function isn't deployed yet.
 * Requires authenticated session (reads auth.uid() server-side).
 */
export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '60')
  const sameTrackOnly =
    (req.nextUrl.searchParams.get('sameTrack') ?? '').toLowerCase() === '1' ||
    (req.nextUrl.searchParams.get('sameTrack') ?? '').toLowerCase() === 'true'

  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try server-side plpgsql matching function first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .rpc('get_matched_creators', { current_user_id: user.id, same_track_only: sameTrackOnly })
      .limit(limit)

    if (!error && data) {
      const rows = Array.isArray(data) ? data : []
      // Ensure deterministic ordering even if the SQL function does not ORDER BY.
      rows.sort((a, b) => {
        const sa = Number((a as any)?.score ?? 0)
        const sb = Number((b as any)?.score ?? 0)
        return sb - sa
      })
      return NextResponse.json({
        profiles: rows.slice(0, limit),
        source: 'db_function',
        sameTrackOnly,
      })
    }

    // Fallback: return profiles ordered by created_at (function not yet deployed)
    const { data: fallback, error: fbErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('onboarding_complete', true)
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fbErr) throw fbErr
    return NextResponse.json({ profiles: fallback ?? [], source: 'fallback' })
  } catch (err) {
    console.error('[/api/match]', err)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
