'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useMessagesInbox } from '@/components/providers/MessagesInboxProvider'
import { MessageRepository, type Message, type Conversation } from '@/supabase/repos/messages'
import { createClient } from '@/supabase/utils/client'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#E7770F,#f5a623)', fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  )
}

function formatTime(dateStr: string, locale: 'en' | 'zh'): string {
  return new Date(dateStr).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Merge Realtime INSERT with optimistic rows: drop matching temp-* so we never duplicate the same id. */
function mergeIncomingMessage(prev: Message[], newMsg: Message): Message[] {
  if (prev.some((m) => m.id === newMsg.id)) return prev
  const withoutMatchingTemp = prev.filter(
    (m) =>
      !(
        m.id.startsWith('temp-') &&
        m.sender_id === newMsg.sender_id &&
        m.content === newMsg.content &&
        m.conversation_id === newMsg.conversation_id
      ),
  )
  return [...withoutMatchingTemp, newMsg]
}

export default function ConversationPage() {
  const { id: conversationId } = useParams<{ id: string }>()
  const router = useRouter()
  const { locale, tr } = useLocale()
  const { sessionUser, loading } = useAuth()
  const { refreshUnread } = useMessagesInbox()
  const repo = useRef(new MessageRepository())
  const supabase = useRef(createClient())

  const [messages, setMessages] = useState<Message[]>([])
  const [conv, setConv] = useState<Conversation | null>(null)
  const [msgLoading, setMsgLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  const loadMessages = useCallback(async () => {
    if (!conversationId || !sessionUser) return
    try {
      const msgs = await repo.current.getMessages(conversationId)
      setMessages(msgs)
    } catch {}
  }, [conversationId, sessionUser])

  // Initial load + conversation info
  useEffect(() => {
    if (!conversationId || !sessionUser) return
    setMsgLoading(true)
    repo.current.listConversations(sessionUser.id)
      .then((convs) => {
        const found = convs.find((c) => c.id === conversationId)
        if (found) setConv(found)
      })
      .catch(() => {})

    loadMessages().finally(() => setMsgLoading(false))
    repo.current
      .markRead(conversationId, sessionUser.id)
      .then(() => {
        void refreshUnread()
      })
      .catch(() => {})
  }, [conversationId, sessionUser, loadMessages, refreshUnread])

  // Supabase Realtime subscription with 5s polling fallback
  useEffect(() => {
    if (!conversationId || !sessionUser) return

    let realtimeWorking = false

    const channel = supabase.current
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          realtimeWorking = true
          const newMsg = payload.new as Message
          setMessages((prev) => mergeIncomingMessage(prev, newMsg))
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') realtimeWorking = true
      })

    // Fallback polling every 5s if Realtime not working
    pollRef.current = setInterval(() => {
      if (!realtimeWorking) loadMessages()
    }, 5000)

    return () => {
      supabase.current.removeChannel(channel)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [conversationId, sessionUser, loadMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !sessionUser || !conversationId || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: sessionUser.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const saved = await repo.current.sendMessage(conversationId, sessionUser.id, content)
      // Realtime may have already appended `saved`; remove temp and ensure a single row per id
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempMsg.id)
        if (withoutTemp.some((m) => m.id === saved.id)) return withoutTemp
        return [...withoutTemp, saved]
      })
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  if (loading || msgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">{tr('common.loading')}</p>
      </div>
    )
  }
  if (!sessionUser) return null

  const otherUser = conv?.other_user
  const otherName = otherUser?.name ?? tr('common.creator')

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/8 shrink-0">
        <button
          type="button"
          className="text-white/60 hover:text-white p-1"
          onClick={() => router.back()}
        >
          ←
        </button>
        <Avatar name={otherName} src={otherUser?.avatar_url} size={32} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{otherName}</p>
          {otherUser?.role && (
            <p className="text-xs text-white/40">{otherUser.role}</p>
          )}
        </div>
        <LanguageSwitcher />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !msgLoading && (
          <div className="text-center py-12">
            <p className="text-white/30 text-sm">{tr('messages.noMessages')}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isSelf = msg.sender_id === sessionUser?.id
          const isSystem = !msg.sender_id
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-xs text-white/30 bg-white/5 rounded-full px-3 py-1">
                  {msg.content}
                </span>
              </div>
            )
          }
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isSelf ? 'justify-end' : 'justify-start'}`}
            >
              {!isSelf && (
                <Avatar name={otherName} src={otherUser?.avatar_url} size={28} />
              )}
              <div className={`max-w-[72%] flex flex-col gap-0.5 ${isSelf ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-3 py-2 text-[14px] leading-snug ${
                    isSelf
                      ? 'text-white rounded-br-sm'
                      : 'text-white/90 bg-white/8 rounded-bl-sm'
                  }`}
                  style={isSelf ? { backgroundColor: '#E7770F' } : undefined}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-white/25">{formatTime(msg.created_at, locale)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-white/8 flex items-center gap-2 bg-[#101837]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={tr('messages.sendPlaceholder')}
          className="flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none"
        />
        <button
          type="button"
          disabled={!input.trim() || sending}
          onClick={handleSend}
          className="rounded-full h-10 w-10 flex items-center justify-center text-white transition-all disabled:opacity-40"
          style={{ backgroundColor: '#E7770F' }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
