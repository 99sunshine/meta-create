import { createClient } from '../utils/client'
import type { Tables } from '@/types'

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

    // Prevent duplicate pending requests
    const { data: existing } = await supabase
      .from('collab_requests')
      .select('id, status')
      .eq('sender_id', params.senderId)
      .eq('receiver_id', params.receiverId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      throw new Error('ALREADY_SENT')
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

    if (error) throw new Error(`Failed to send request: ${error.message}`)
    return data
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
}
