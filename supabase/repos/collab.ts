import { createClient } from '../utils/client'
import type { Tables } from '@/types'
import { assertSafeText } from '@/lib/content-safety'

export type CollabRequest = Tables<'collab_requests'>
export type CollabStatus = 'pending' | 'accepted' | 'declined'
export type CollabType = 'join_project' | 'invite_to_team' | 'just_connect'

export interface CollabRequestWithProfiles extends CollabRequest {
  sender: { id: string; name: string; role: string; avatar_url: string | null } | null
  receiver: { id: string; name: string; role: string; avatar_url: string | null } | null
}

export class CollabRepository {
  /** Send a new collab request. Returns the created row. */
  async sendRequest(params: {
    senderId: string
    receiverId: string
    type: CollabType
    message?: string
    iceBreakerText?: string
    teamId?: string
    matchScore?: number
  }): Promise<CollabRequest> {
    const supabase = createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) throw new Error('UNAUTHENTICATED')
    if (user.id !== params.senderId) throw new Error('SENDER_MISMATCH')

    // Block if already connected (accepted in either direction) or pending in this direction
    const { data: existingAny, error: existingErr } = await supabase
      .from('collab_requests')
      .select('id, status')
      .or(
        `and(sender_id.eq.${params.senderId},receiver_id.eq.${params.receiverId}),and(sender_id.eq.${params.receiverId},receiver_id.eq.${params.senderId})`,
      )
      .in('status', ['pending', 'accepted'])
      .limit(1)
      .maybeSingle()

    if (existingErr) throw new Error(`CHECK_FAILED:${existingErr.message}`)
    if (existingAny?.status === 'accepted') throw new Error('ALREADY_CONNECTED')
    if (existingAny?.status === 'pending') throw new Error('ALREADY_SENT')

    assertSafeText(params.message ?? params.iceBreakerText ?? null, '消息')
    // Layer 2 (optional) - server-side AI moderation.
    try {
      const text = (params.message ?? params.iceBreakerText ?? '').trim()
      if (text) {
        const res = await fetch('/api/content/safety-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, fieldLabel: '消息' }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          if (res.status === 400 && (j as any)?.code === 'CONTENT_SAFETY') {
            throw new Error((j as any)?.error ?? '消息包含不允许的内容，请修改后再提交。')
          }
          // moderation service unavailable / throttled → don't block user beyond blacklist
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('包含不允许的内容')) throw e
    }

    const { data, error } = await supabase
      .from('collab_requests')
      .insert({
        sender_id: params.senderId,
        receiver_id: params.receiverId,
        type: params.type,
        status: 'pending',
        message: params.message ?? null,
        ice_breaker: params.iceBreakerText ?? null,
        team_id: params.teamId ?? null,
        match_score: params.matchScore ?? null,
      })
      .select()
      .single()

    if (error) {
      const msg = error.message || ''
      if (msg.toLowerCase().includes('row-level security')) throw new Error('RLS_DENIED')
      if (msg.toLowerCase().includes('duplicate key')) throw new Error('DUPLICATE')
      throw new Error(`Failed to send request: ${msg}`)
    }
    if (!data?.id) throw new Error('INSERT_NO_RETURN')
    return data
  }

  /** Count pending requests where user is receiver (for inbox badges). */
  async countPendingInbox(receiverId: string): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('collab_requests')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', receiverId)
      .eq('status', 'pending')

    if (error) throw new Error(`Failed to count pending requests: ${error.message}`)
    return count ?? 0
  }

  /** Get inbox (requests received by userId). */
  async getInbox(userId: string): Promise<CollabRequestWithProfiles[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('collab_requests')
      .select(`
        *,
        sender:profiles!collab_requests_sender_id_fkey(id, name, role, avatar_url),
        receiver:profiles!collab_requests_receiver_id_fkey(id, name, role, avatar_url)
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch inbox: ${error.message}`)
    return (data ?? []) as CollabRequestWithProfiles[]
  }

  /** Get outbox (requests sent by userId). */
  async getOutbox(userId: string): Promise<CollabRequestWithProfiles[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('collab_requests')
      .select(`
        *,
        sender:profiles!collab_requests_sender_id_fkey(id, name, role, avatar_url),
        receiver:profiles!collab_requests_receiver_id_fkey(id, name, role, avatar_url)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch outbox: ${error.message}`)
    return (data ?? []) as CollabRequestWithProfiles[]
  }

  /** Respond to a request (accept / decline). Only the receiver may call this. */
  async respond(requestId: string, status: 'accepted' | 'declined'): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('collab_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) throw new Error(`Failed to respond: ${error.message}`)
  }

  /** Check whether currentUser already has a pending request to targetUserId. */
  async checkExisting(senderId: string, receiverId: string): Promise<CollabStatus | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from('collab_requests')
      .select('status')
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data?.status as CollabStatus) ?? null
  }

  /**
   * Batch: return the set of user IDs that have an accepted collab connection
   * with `userId` in either direction. Used to hide Connect buttons in the feed.
   */
  async getAcceptedPartnerIds(userId: string): Promise<Set<string>> {
    const supabase = createClient()
    const { data } = await supabase
      .from('collab_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    const ids = new Set<string>()
    for (const row of data ?? []) {
      if (row.sender_id !== userId) ids.add(row.sender_id as string)
      if (row.receiver_id !== userId) ids.add(row.receiver_id as string)
    }
    return ids
  }
}
