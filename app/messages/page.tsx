'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { MessageRepository, type Conversation } from '@/supabase/repos/messages'

function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#E7770F,#f5a623)', fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function MessagesPage() {
  const router = useRouter()
  const { sessionUser, loading, profileLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [listLoading, setListLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    if (!sessionUser) return
    setListLoading(true)
    try {
      const repo = new MessageRepository()
      const convs = await repo.listConversations(sessionUser.id)
      setConversations(convs)
    } catch (e) {
      console.error('Failed to load conversations:', e)
    } finally {
      setListLoading(false)
    }
  }, [sessionUser])

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (sessionUser) loadConversations()
  }, [sessionUser, loadConversations])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/60 text-sm">Loading…</p>
      </div>
    )
  }
  if (!sessionUser) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-white/8">
        <p className="text-base font-semibold text-white">Messages</p>
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 transition-colors"
          onClick={() => router.push('/messages/requests')}
        >
          协作请求
        </button>
      </div>

      <main className="pb-24">
        {listLoading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
            <p className="text-4xl">📡</p>
            <p className="text-white/60 text-sm">还没有会话</p>
            <p className="text-white/30 text-xs leading-relaxed">
              发送协作请求并被对方接受后，会话会自动创建
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-[#e46d2e] border border-[#e46d2e]/30 rounded-full px-4 py-2"
              onClick={() => router.push('/explore')}
            >
              去 Explore 认识创造者 →
            </button>
          </div>
        ) : (
          <div>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] hover:bg-white/5 transition-colors text-left"
                onClick={() => router.push(`/messages/${conv.id}`)}
              >
                <Avatar
                  name={conv.other_user?.name ?? '?'}
                  src={conv.other_user?.avatar_url}
                  size={44}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[14px] font-semibold text-white truncate">
                      {conv.other_user?.name ?? 'Creator'}
                    </p>
                    {(conv.last_message_at ?? conv.created_at) && (
                      <p className="text-[11px] text-white/30 shrink-0 ml-2">
                        {timeAgo(conv.last_message_at ?? conv.created_at)}
                      </p>
                    )}
                  </div>
                  <p className="text-[12px] text-white/40 truncate">
                    {conv.last_message ?? '连接已建立 🎉'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <BottomTabs />
    </div>
  )
}
