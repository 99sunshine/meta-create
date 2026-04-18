'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { UserProfile } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { scoreUserMatch } from '@/lib/matching'
import { SendCollabModal } from '@/components/features/collab/SendCollabModal'

function initialsFromName(name: string | null | undefined) {
  const safe = (name ?? '').trim()
  if (!safe) return '?'
  return safe
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type CreatorCardProps = {
  creator: UserProfile
  /** Already connected (accepted collab in either direction) — hides Connect button */
  connected?: boolean
}

export function CreatorCard({ creator, connected = false }: CreatorCardProps) {
  const { user, sessionUser } = useAuth()
  const [open, setOpen] = useState(false)

  const match = useMemo(() => {
    if (!user) return null
    if (user.id === creator.id) return null
    return scoreUserMatch(user, creator)
  }, [user, creator])

  const percent = match?.score ?? 0
  const subtitleParts = [
    creator.role ? String(creator.role) : null,
    creator.school ? String(creator.school) : null,
    creator.city ? String(creator.city) : null,
  ].filter(Boolean)

  const chips = (creator.skills ?? []).slice(0, 3)
  const chipStyles = [
    'bg-[rgba(115,27,209,0.2)] border-[rgba(115,27,209,0.5)] text-[#b98de8]',
    'bg-[rgba(115,27,209,0.2)] border-[rgba(115,27,209,0.5)] text-[#b98de8]',
    'bg-[rgba(15,134,136,0.2)] border-[rgba(15,134,136,0.5)] text-[#70b7b8]',
  ]

  return (
    <>
      <div
        className="border border-[rgba(255,255,255,0.06)] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] rounded-[16px] overflow-hidden p-[14px] flex flex-col gap-[10px]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, rgba(25,76,178,0.25) 0%, rgba(244,140,36,0.25) 100%)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center gap-[10px] w-full">
          <Link href={`/creator/${creator.id}`} className="shrink-0">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.name ?? 'avatar'}
                className="h-[44px] w-[44px] rounded-[22px] object-cover bg-white/10"
              />
            ) : (
              <div className="h-[44px] w-[44px] rounded-[22px] bg-white/10 flex items-center justify-center text-white/80 text-sm font-semibold">
                {initialsFromName(creator.name)}
              </div>
            )}
          </Link>

          <Link href={`/creator/${creator.id}`} className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-white truncate">
              {creator.name ?? 'Creator'}
            </p>
            <p className="text-[12px] text-[#bfbfbf] truncate">
              {subtitleParts.length ? subtitleParts.join(' · ') : '—'}
            </p>
          </Link>

          {/* Match badge */}
          {user && percent > 0 && (
            <div className="shrink-0 rounded-[10px] border border-[rgba(228,109,46,0.5)] bg-[rgba(228,109,46,0.15)] px-2 py-1">
              <p className="text-[12px] font-semibold text-[#e46d2e] whitespace-nowrap">
                {Math.round(percent)}%
              </p>
            </div>
          )}
        </div>

        {/* Chips */}
        {chips.length > 0 && (
          <div className="flex items-center gap-[6px] overflow-x-auto">
            {chips.map((c, idx) => (
              <span
                key={c}
                className={`shrink-0 rounded-[12px] border px-2 py-1 text-[11px] ${chipStyles[idx] ?? 'bg-white/10 border-white/10 text-white/70'}`}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center gap-2 w-full">
          <p className="flex-1 text-[11px] text-[#e88dba] truncate">
            {creator.tags?.[0] ? `→ ${String(creator.tags[0])}` : '→ Connect'}
          </p>
          {sessionUser && user?.id !== creator.id && (
            connected ? (
              <span className="shrink-0 rounded-[14px] bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] px-[12px] py-[6px] text-[12px] font-medium text-green-400">
                已连接
              </span>
            ) : (
              <button
                type="button"
                className="shrink-0 rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white hover:bg-white/15 transition-colors"
                onClick={() => setOpen(true)}
              >
                Connect
              </button>
            )
          )}
        </div>
      </div>

      {sessionUser && user?.id !== creator.id && !connected && (
        <SendCollabModal
          open={open}
          onClose={() => setOpen(false)}
          senderId={sessionUser.id}
          senderName={user?.name ?? sessionUser.email ?? 'You'}
          senderRole={user?.role ?? undefined}
          receiverId={creator.id}
          receiverName={creator.name ?? 'Creator'}
          receiverRole={creator.role ?? undefined}
          matchScore={user ? percent : undefined}
        />
      )}
    </>
  )
}

