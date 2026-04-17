import { createClient } from '@/supabase/utils/client'

export interface Conversation {
  id: string
  created_from_request_id: string | null
  created_at: string
  last_message_at: string | null
  // Joined
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

  /** List all conversations for the current user, with partner info and last message */
  async listConversations(userId: string): Promise<Conversation[]> {
    // Get conversation_ids where user participates
    const { data: participations, error: pErr } = await this.supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    if (pErr || !participations?.length) return []

    const convIds = participations.map((p) => p.conversation_id as string)

    // Get conversations
    const { data: convs, error: cErr } = await this.supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (cErr || !convs?.length) return []

    // For each conversation, get the other participant's profile + last message
    const results: Conversation[] = await Promise.all(
      convs.map(async (conv) => {
        // Other participant
        const { data: otherPart } = await this.supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', userId)
          .limit(1)
          .single()

        let other_user: Conversation['other_user'] = undefined
        if (otherPart?.user_id) {
          const { data: profile } = await this.supabase
            .from('profiles')
            .select('id, name, avatar_url, role')
            .eq('id', otherPart.user_id)
            .single()
          if (profile) {
            other_user = {
              id: profile.id as string,
              name: (profile.name as string) || 'Creator',
              avatar_url: profile.avatar_url as string | null,
              role: profile.role as string | null,
            }
          }
        }

        // Last message
        const { data: lastMsg } = await this.supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return {
          id: conv.id as string,
          created_from_request_id: conv.created_from_request_id as string | null,
          created_at: conv.created_at as string,
          last_message_at: conv.last_message_at as string | null,
          other_user,
          last_message: lastMsg?.content as string | undefined,
        } satisfies Conversation
      }),
    )

    return results
  }

  /** Get messages for a conversation (paginated, latest first) */
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

  /** Send a message */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Update last_message_at
    await this.supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data as Message
  }

  /** Mark conversation as read for current user */
  async markRead(conversationId: string, userId: string) {
    await this.supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
  }
}
