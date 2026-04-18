import { createClient } from '../utils/client'

export interface Conversation {
  id: string
  created_from_request_id: string | null
  created_at: string
  last_message_at: string | null
  // Joined / denormalized
  other_user?: {
    id: string
    name: string
    avatar_url: string | null
    role: string | null
  }
  last_message?: string
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string
  created_at: string
}

export class MessageRepository {
  private supabase = createClient()

  /**
   * List conversations for the user with partner + last preview (from conversations row).
   * Batched queries (no per-row messages fetch).
   */
  async listConversations(userId: string): Promise<Conversation[]> {
    const { data: myParts, error: pErr } = await this.supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId)

    if (pErr || !myParts?.length) return []

    const readMap = new Map(
      myParts.map((p) => [p.conversation_id as string, p.last_read_at as string | null]),
    )
    const convIds = [...readMap.keys()]

    const { data: convs, error: cErr } = await this.supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (cErr || !convs?.length) return []

    const { data: allParts, error: apErr } = await this.supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)

    if (apErr) return []

    const otherByConv = new Map<string, string>()
    for (const row of allParts ?? []) {
      const cid = row.conversation_id as string
      const uid = row.user_id as string
      if (uid !== userId) otherByConv.set(cid, uid)
    }

    const otherIds = [...new Set(otherByConv.values())]
    const profileById = new Map<
      string,
      { id: string; name: string; avatar_url: string | null; role: string | null }
    >()

    if (otherIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('id, name, avatar_url, role')
        .in('id', otherIds)

      for (const p of profiles ?? []) {
        profileById.set(p.id as string, {
          id: p.id as string,
          name: (p.name as string) || 'Creator',
          avatar_url: p.avatar_url as string | null,
          role: p.role as string | null,
        })
      }
    }

    return convs.map((conv) => {
      const id = conv.id as string
      const otherId = otherByConv.get(id)
      const prof = otherId ? profileById.get(otherId) : undefined
      const lastRead = readMap.get(id) ?? null
      const lastAt = conv.last_message_at as string | null
      const senderId = (conv.last_message_sender_id as string | null) ?? null

      let unread = 0
      if (lastAt && senderId && senderId !== userId) {
        if (!lastRead || new Date(lastAt) > new Date(lastRead)) unread = 1
      }

      return {
        id,
        created_from_request_id: conv.created_from_request_id as string | null,
        created_at: conv.created_at as string,
        last_message_at: lastAt,
        last_message: (conv.last_message_content as string | null) ?? undefined,
        other_user: prof,
        unread_count: unread,
      } satisfies Conversation
    })
  }

  /** Total conversations with unread messages for the current user */
  async countUnreadConversations(userId: string): Promise<number> {
    const list = await this.listConversations(userId)
    return list.reduce((n, c) => n + (c.unread_count ?? 0), 0)
  }

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data ?? []) as Message[]
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select()
      .single()

    if (error) throw new Error(error.message)
    // conversations row updated by trigger fn_messages_sync_conversation
    return data as Message
  }

  async markRead(conversationId: string, userId: string) {
    await this.supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
  }
}
