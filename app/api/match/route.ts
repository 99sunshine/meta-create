import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/server'

async function getExcludedCreatorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Set<string>> {
  const excluded = new Set<string>()

  const { data: collabRows, error: collabErr } = await supabase
    .from('collab_requests')
    .select('sender_id, receiver_id')
    .in('status', ['pending', 'accepted'])
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

  if (collabErr) throw collabErr
  for (const row of collabRows ?? []) {
    if (row.sender_id && row.sender_id !== userId) excluded.add(row.sender_id)
    if (row.receiver_id && row.receiver_id !== userId) excluded.add(row.receiver_id)
  }

  const { data: myTeamRows, error: myTeamErr } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)

  if (myTeamErr) throw myTeamErr
  const teamIds = [...new Set((myTeamRows ?? []).map((row) => row.team_id).filter(Boolean))]
  if (teamIds.length === 0) return excluded

  const { data: teamMateRows, error: teamMateErr } = await supabase
    .from('team_members')
    .select('user_id')
    .in('team_id', teamIds)

  if (teamMateErr) throw teamMateErr
  for (const row of teamMateRows ?? []) {
    if (row.user_id && row.user_id !== userId) excluded.add(row.user_id)
  }

  return excluded
}

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

    // Fallback: keep behavior aligned with SQL path for fresh discovery.
    const excludedIds = await getExcludedCreatorIds(supabase, user.id)

    const { data: fallback, error: fbErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('onboarding_complete', true)
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 2, limit + 20))

    if (fbErr) throw fbErr
    const filtered = (fallback ?? []).filter((row) => !excludedIds.has(String(row.id)))
    return NextResponse.json({ profiles: filtered.slice(0, limit), source: 'fallback' })
  } catch (err) {
    console.error('[/api/match]', err)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}
