'use client'

import { useCollabInbox } from '@/hooks/useCollabRequests'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CollabInboxProps {
  userId: string
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: 'linear-gradient(135deg,#E7770F,#f5a623)' }}
    >
      {initials || '?'}
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  just_connect: '🤝 Just Connect',
  join_project: '🚀 Join Project',
  invite_to_team: '👥 Invite to Team',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20',
  accepted: 'bg-green-500/15 text-green-300 border border-green-500/20',
  declined: 'bg-red-500/15 text-red-300 border border-red-500/20',
}

export function CollabInbox({ userId }: CollabInboxProps) {
  const { inbox, loading, error, respond } = useCollabInbox(userId)

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse border border-white/5" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  if (inbox.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-8 text-center">
        <p className="text-sm text-white/30">No collab requests yet.</p>
        <p className="text-xs text-white/20 mt-1">When someone sends you a request, it will appear here.</p>
      </div>
    )
  }

  const pending = inbox.filter((r) => r.status === 'pending')
  const others = inbox.filter((r) => r.status !== 'pending')

  const renderRequest = (req: (typeof inbox)[0]) => {
    const sender = req.sender
    if (!sender) return null
    return (
      <div key={req.id} className="rounded-xl border border-white/8 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <Link href={`/creator/${sender.id}`}>
            <Avatar name={sender.name} />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <Link href={`/creator/${sender.id}`} className="text-sm font-semibold text-white hover:text-orange-300 transition-colors">
                {sender.name}
              </Link>
              <span className="text-xs text-white/40">{sender.role}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[req.status] ?? ''}`}>
                {req.status}
              </span>
            </div>

            <p className="text-xs text-white/50 mb-1">
              {TYPE_LABEL[req.type] ?? req.type}
            </p>

            {req.ice_breaker && (
              <p className="text-sm text-white/70 italic mb-1 line-clamp-2">
                &ldquo;{req.ice_breaker}&rdquo;
              </p>
            )}
            {req.message && (
              <p className="text-sm text-white/60 mb-1 line-clamp-2">{req.message}</p>
            )}

            <p className="text-xs text-white/25">
              {new Date(req.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {req.status === 'pending' && (
          <div className="flex gap-2 mt-3 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => respond(req.id, 'declined')}
              className="text-xs text-white/50 hover:text-white border border-white/10 hover:bg-white/5 h-7 px-3"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => respond(req.id, 'accepted')}
              className="text-xs text-white font-medium h-7 px-3"
              style={{ backgroundColor: '#E7770F' }}
            >
              Accept
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">
            Pending ({pending.length})
          </p>
          <div className="space-y-2">{pending.map(renderRequest)}</div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2 mt-4">History</p>
          <div className="space-y-2">{others.map(renderRequest)}</div>
        </div>
      )}
    </div>
  )
}
