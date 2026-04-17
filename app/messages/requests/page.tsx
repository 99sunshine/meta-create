'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CollabRepository, type CollabRequestWithProfiles } from '@/supabase/repos/collab'
import { trackEvent } from '@/lib/analytics'

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

export default function CollabRequestsPage() {
  const router = useRouter()
  const { sessionUser, loading } = useAuth()
  const [requests, setRequests] = useState<CollabRequestWithProfiles[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    if (!sessionUser) return
    setListLoading(true)
    try {
      const repo = new CollabRepository()
      const inbox = await repo.getInbox(sessionUser.id)
      setRequests(inbox)
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
      setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status } : r))
    } catch (e) {
      console.error('respond failed', e)
    } finally {
      setResponding(null)
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const history = requests.filter((r) => r.status !== 'pending')

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
        {/* Pending */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            待处理 ({pending.length})
          </p>
          {pending.length === 0 ? (
            <p className="text-sm text-white/30">没有待处理的请求</p>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  isResponding={responding === req.id}
                  onAccept={() => handleRespond(req, 'accepted')}
                  onDecline={() => handleRespond(req, 'declined')}
                />
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">历史记录</p>
            <div className="space-y-2">
              {history.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <Avatar name={req.sender?.name ?? '?'} src={req.sender?.avatar_url} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{req.sender?.name ?? 'Creator'}</p>
                    <p className="text-xs text-white/30">{timeAgo(req.created_at)}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'accepted'
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-white/5 text-white/30'
                    }`}
                  >
                    {req.status === 'accepted' ? '已接受' : '已拒绝'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RequestCard({
  req,
  isResponding,
  onAccept,
  onDecline,
}: {
  req: CollabRequestWithProfiles
  isResponding: boolean
  onAccept: () => void
  onDecline: () => void
}) {
  const router = useRouter()
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/creator/${req.sender_id}`)}
          className="shrink-0"
        >
          <Avatar name={req.sender?.name ?? '?'} src={req.sender?.avatar_url} size={44} />
        </button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="text-sm font-semibold text-white text-left truncate w-full"
            onClick={() => router.push(`/creator/${req.sender_id}`)}
          >
            {req.sender?.name ?? 'Creator'}
          </button>
          <p className="text-xs text-white/40">
            {req.sender?.role ?? ''} · {timeAgo(req.created_at)}
          </p>
        </div>
        {req.match_score && (
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', border: '1px solid rgba(231,119,15,0.3)' }}
          >
            {req.match_score}%
          </span>
        )}
      </div>

      {(req.ice_breaker ?? req.message) && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
          <p className="text-[13px] text-white/70 leading-snug italic">
            &ldquo;{req.ice_breaker ?? req.message}&rdquo;
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={isResponding}
          onClick={onDecline}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-white/50 hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          跳过
        </button>
        <button
          type="button"
          disabled={isResponding}
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
