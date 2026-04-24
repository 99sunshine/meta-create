'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WorkWithCreator } from '@/types'
import { Card } from '@/components/ui/card'
import { getRoleMetadata } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { SendCollabModal } from '@/components/features/collab/SendCollabModal'
import type { Role } from '@/types/interfaces/Role'

interface WorkCardProps {
  work: WorkWithCreator
  matchScore?: number
  matchReasons?: string[]
}

export function WorkCard({ work, matchScore, matchReasons }: WorkCardProps) {
  const { user } = useAuth()
  const [connectOpen, setConnectOpen] = useState(false)

  const roleMetadata = getRoleMetadata(work.creator.role as Role)
  const RoleIcon = roleMetadata?.icon

  const displayTags = work.tags?.slice(0, 3) || []
  const displayDescription = work.description.length > 150
    ? work.description.slice(0, 150) + '...'
    : work.description

  const canConnect = !!user && user.id !== work.creator.id

  return (
    <Card className="overflow-hidden border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
      {work.images && work.images.length > 0 && (
        <div className="aspect-video w-full overflow-hidden bg-slate-900/50">
          <img
            src={work.images[0]}
            alt={work.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Match score badge */}
        {matchScore !== undefined && matchScore > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', border: '1px solid rgba(231,119,15,0.3)' }}
            >
              🎯 {matchScore}% match
            </span>
            {matchReasons?.map((r) => (
              <span key={r} className="text-xs text-white/40">{r}</span>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white line-clamp-2">{work.title}</h3>
          <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {work.category}
          </span>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2">{displayDescription}</p>

        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: creator info + Connect button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700 gap-2">
          <Link
            href={`/creator/${work.creator.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {work.creator.avatar_url ? (
                <img
                  src={work.creator.avatar_url}
                  alt={work.creator.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                work.creator.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{work.creator.name}</span>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {RoleIcon && <RoleIcon className="h-3 w-3 shrink-0" />}
                <span className="truncate">{work.creator.role}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {work.save_count > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <span>❤️</span>
                <span>{work.save_count}</span>
              </div>
            )}
            {canConnect && (
              <button
                onClick={() => setConnectOpen(true)}
                className="text-xs px-3 py-1.5 rounded-full border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400/60 transition-colors font-medium"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collab modal */}
      {canConnect && (
        <SendCollabModal
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          senderId={user.id}
          receiverId={work.creator.id}
          receiverName={work.creator.name}
          receiverRole={work.creator.role}
          senderRole={user.role ?? undefined}
          senderName={user.name ?? undefined}
          matchScore={matchScore}
        />
      )}
    </Card>
  )
}
