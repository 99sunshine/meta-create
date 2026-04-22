'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CollabRepository, type CollabRequestWithProfiles } from '@/supabase/repos/collab'
import { trackEvent } from '@/lib/analytics'
import { useMessagesInbox } from '@/components/providers/MessagesInboxProvider'

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
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** Group a flat list by sender_id; return one rep per sender (latest pending first, else latest any). */
function groupBySender(reqs: CollabRequestWithProfiles[]): {
  rep: CollabRequestWithProfiles
  all: CollabRequestWithProfiles[]
}[] {
  const map = new Map<string, CollabRequestWithProfiles[]>()
  for (const r of reqs) {
    const key = r.sender_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return [...map.values()].map((group) => {
    // Sort: pending first, then by created_at desc
    const sorted = [...group].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { rep: sorted[0], all: sorted }
  })
}

export default function CollabRequestsPage() {
  const router = useRouter()
  const { refreshUnread } = useMessagesInbox()
  const { sessionUser, loading } = useAuth()
  const [inbox, setInbox] = useState<CollabRequestWithProfiles[]>([])
  const [outbox, setOutbox] = useState<CollabRequestWithProfiles[]>([])
  const [view, setView] = useState<'inbox' | 'outbox'>('inbox')
  const [listLoading, setListLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    if (!sessionUser) return
    setListLoading(true)
    try {
      const repo = new CollabRepository()
      const [inb, outb] = await Promise.all([
        repo.getInbox(sessionUser.id),
        repo.getOutbox(sessionUser.id),
      ])
      setInbox(inb)
      setOutbox(outb)
    } catch {}
    finally { setListLoading(false) }
  }, [sessionUser])

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (sessionUser) loadRequests()
  }, [sessionUser, loadRequests])

  const handleRespond = async (req: CollabRequestWithProfiles, status: 'accepted' | 'declined') => {
    setResponding(req.id)
    try {
      const repo = new CollabRepository()
      await repo.respond(req.id, status)
      if (status === 'accepted') {
        trackEvent('collab_request_accepted', { request_id: req.id, sender_id: req.sender_id })
      }
      setInbox((prev) => prev.map((r) => r.id === req.id ? { ...r, status } : r))
      void refreshUnread()
    } catch (e) {
      console.error('respond failed', e)
    } finally {
      setResponding(null)
    }
  }

  const activeList = view === 'inbox' ? inbox : outbox
  const pendingGroups = useMemo(
    () => groupBySender(activeList.filter((r) => r.status === 'pending')),
    [activeList],
  )

  const historyGroups = useMemo(
    () => groupBySender(activeList.filter((r) => r.status !== 'pending')),
    [activeList],
  )

  if (loading || listLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">Loading…</p>
      </div>
    )
  }
  if (!sessionUser) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/8">
        <button type="button" className="text-white/60 hover:text-white p-1" onClick={() => router.back()}>←</button>
        <p className="text-base font-semibold text-white">协作请求</p>
      </div>

      <div className="px-4 py-4 pb-24 space-y-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('inbox')}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${
              view === 'inbox' ? 'bg-white/15 text-white border-white/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            我收到的
          </button>
          <button
            type="button"
            onClick={() => setView('outbox')}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${
              view === 'outbox' ? 'bg-white/15 text-white border-white/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            我发出的
          </button>
        </div>

        {/* Pending — grouped by sender */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            待处理 ({pendingGroups.length})
          </p>
          {pendingGroups.length === 0 ? (
            <p className="text-sm text-white/30">没有待处理的请求</p>
          ) : (
            <div className="space-y-3">
              {pendingGroups.map(({ rep, all }) => (
                <RequestCard
                  key={rep.sender_id}
                  rep={rep}
                  total={all.length}
                  isResponding={responding === rep.id}
                  onAccept={view === 'inbox' ? () => handleRespond(rep, 'accepted') : undefined}
                  onDecline={view === 'inbox' ? () => handleRespond(rep, 'declined') : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* History — grouped by sender */}
        {historyGroups.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">历史记录</p>
            <div className="space-y-2">
              {historyGroups.map(({ rep, all }) => {
                const hasAccepted = all.some((r) => r.status === 'accepted')
                return (
                  <div
                    key={rep.sender_id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  >
                    <Avatar name={rep.sender?.name ?? '?'} src={rep.sender?.avatar_url} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 truncate">{rep.sender?.name ?? 'Creator'}</p>
                      <p className="text-xs text-white/30">
                        {timeAgo(rep.created_at)}
                        {all.length > 1 && (
                          <span className="ml-1 text-white/20">· {all.length} 条</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        hasAccepted
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {hasAccepted ? '已接受' : '已拒绝'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RequestCard({
  rep,
  total,
  isResponding,
  onAccept,
  onDecline,
}: {
  rep: CollabRequestWithProfiles
  total: number
  isResponding: boolean
  onAccept?: () => void
  onDecline?: () => void
}) {
  const router = useRouter()
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/creator/${rep.sender_id}`)}
          className="shrink-0"
        >
          <Avatar name={rep.sender?.name ?? '?'} src={rep.sender?.avatar_url} size={44} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-sm font-semibold text-white text-left truncate"
              onClick={() => router.push(`/creator/${rep.sender_id}`)}
            >
              {rep.sender?.name ?? 'Creator'}
            </button>
            {total > 1 && (
              <span className="shrink-0 rounded-full bg-white/10 px-[7px] py-[1px] text-[10px] text-white/50">
                {total} 条
              </span>
            )}
          </div>
          <p className="text-xs text-white/40">
            {rep.sender?.role ?? ''} · {timeAgo(rep.created_at)}
          </p>
        </div>
        {rep.match_score && (
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', border: '1px solid rgba(231,119,15,0.3)' }}
          >
            {rep.match_score}%
          </span>
        )}
      </div>

      {(rep.ice_breaker ?? rep.message) && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
          <p className="text-[13px] text-white/70 leading-snug italic">
            &ldquo;{rep.ice_breaker ?? rep.message}&rdquo;
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={isResponding || !onDecline}
          onClick={onDecline}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white/50 hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          跳过
        </button>
        <button
          type="button"
          disabled={isResponding || !onAccept}
          onClick={onAccept}
          className="flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: '#E7770F' }}
        >
          {isResponding ? '处理中…' : '接受 🤝'}
        </button>
      </div>
    </div>
  )
}
