'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { MessageRepository, type Conversation } from '@/supabase/repos/messages'
import { useMessagesInbox } from '@/components/providers/MessagesInboxProvider'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

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

function timeAgo(dateStr: string, tr: (key: string, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return tr('messages.justNow')
  if (mins < 60) return tr('messages.min', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return tr('messages.hour', { count: hours })
  return tr('messages.day', { count: Math.floor(hours / 24) })
}

export default function MessagesPage() {
  const router = useRouter()
  const { tr } = useLocale()
  const { sessionUser, loading, profileLoading } = useAuth()
  const { refreshUnread, pendingCollabCount } = useMessagesInbox()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [listLoading, setListLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    if (!sessionUser) return
    setListLoading(true)
    try {
      const repo = new MessageRepository()
      const convs = await repo.listConversations(sessionUser.id)
      setConversations(convs)
      void refreshUnread()
    } catch (e) {
      console.error('Failed to load conversations:', e)
    } finally {
      setListLoading(false)
    }
  }, [sessionUser, refreshUnread])

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (sessionUser) loadConversations()
  }, [sessionUser, loadConversations])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/60 text-sm">{tr('common.loading')}</p>
      </div>
    )
  }
  if (!sessionUser) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-white/8">
        <p className="text-base font-semibold text-white">{tr('messages.title')}</p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            className="relative rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 transition-colors"
            onClick={() => router.push('/messages/requests')}
          >
            {tr('messages.collabRequests')}
            {pendingCollabCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#e46d2e] px-[4px] text-[9px] font-bold leading-none text-white">
                {pendingCollabCount > 99 ? '99+' : pendingCollabCount}
              </span>
            ) : null}
          </button>
        </div>
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
            <p className="text-white/60 text-sm">{tr('messages.noConversations')}</p>
            <p className="text-white/30 text-xs leading-relaxed">
              {tr('messages.noConversationsHint')}
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-[#e46d2e] border border-[#e46d2e]/30 rounded-full px-4 py-2"
              onClick={() => router.push('/explore')}
            >
              {tr('messages.discoverCreators')}
            </button>
          </div>
        ) : (
          <div>
            {conversations.map((conv) => {
              const hasUnread = (conv.unread_count ?? 0) > 0
              return (
                <button
                  key={conv.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] hover:bg-white/5 transition-colors text-left"
                  onClick={() => router.push(`/messages/${conv.id}`)}
                >
                  {/* 未读蓝点 */}
                  <div className="relative shrink-0">
                    <Avatar
                      name={conv.other_user?.name ?? '?'}
                      src={conv.other_user?.avatar_url}
                      size={44}
                    />
                    {hasUnread && (
                      <span className="absolute -right-[1px] -top-[1px] h-[10px] w-[10px] rounded-full bg-[#e46d2e] ring-2 ring-[#101837]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-[14px] truncate ${hasUnread ? 'font-bold text-white' : 'font-semibold text-white'}`}>
                        {conv.other_user?.name ?? tr('common.creator')}
                      </p>
                      {(conv.last_message_at ?? conv.created_at) && (
                        <p className={`text-[11px] shrink-0 ml-2 ${hasUnread ? 'text-[#e46d2e] font-semibold' : 'text-white/30'}`}>
                          {timeAgo(conv.last_message_at ?? conv.created_at, tr)}
                        </p>
                      )}
                    </div>
                    <p className={`text-[12px] truncate ${hasUnread ? 'text-white/70 font-medium' : 'text-white/40'}`}>
                      {conv.last_message ?? tr('messages.connectedDefault')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      <BottomTabs />
    </div>
  )
}
