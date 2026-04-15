'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProfileRepository } from '@/supabase/repos/profile'
import { useAuth } from '@/hooks/useAuth'
import { scoreUserMatch } from '@/lib/matching'
import type { UserProfile } from '@/types'

const profileRepo = new ProfileRepository()

export function NewCreatorsSection() {
  const { user } = useAuth()
  const [creators, setCreators] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    profileRepo
      .getRecentProfiles(7, 20)
      .then((profiles) => {
        // Exclude the current user from the list
        setCreators(profiles.filter((p) => p.id !== user?.id))
      })
      .catch(() => setCreators([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!loading && creators.length === 0) return null

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
          ✨ New Creators This Week
        </h2>
        <Link
          href="/explore?sort=new"
          className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          See all →
        </Link>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-36 h-44 rounded-xl bg-slate-800/40 border border-white/5 animate-pulse"
              />
            ))
          : creators.map((creator) => (
              <NewCreatorCard key={creator.id} creator={creator} viewer={user} />
            ))}
      </div>
    </div>
  )
}

// ─── Mini creator card ─────────────────────────────────────────────────────────

function NewCreatorCard({
  creator,
  viewer,
}: {
  creator: UserProfile
  viewer: UserProfile | null
}) {
  const match = viewer ? scoreUserMatch(viewer, creator) : null

  const initials = creator.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const roleColor: Record<string, string> = {
    Visionary: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Builder:   'bg-blue-500/20   text-blue-300   border-blue-500/30',
    Strategist:'bg-green-500/20  text-green-300  border-green-500/30',
    Connector: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  }

  return (
    <Link
      href={`/creator/${creator.id}`}
      className="shrink-0 w-36 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-orange-400/40 transition-all p-3 flex flex-col items-center text-center gap-2 group"
    >
      {/* Avatar */}
      <div className="relative">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.name ?? ''}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-orange-400/50 transition-colors"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/40 to-purple-500/40 flex items-center justify-center text-sm font-bold text-white border-2 border-white/10 group-hover:border-orange-400/50 transition-colors">
            {initials}
          </div>
        )}
        {/* "New" badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-slate-900 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">N</span>
        </span>
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-white leading-tight line-clamp-2 w-full">
        {creator.name ?? 'Creator'}
      </p>

      {/* Role badge */}
      {creator.role && (
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            roleColor[creator.role] ?? 'bg-white/10 text-white/60 border-white/10'
          }`}
        >
          {creator.role}
        </span>
      )}

      {/* Match score (if logged in) */}
      {match && match.score > 0 && (
        <span className="text-[10px] text-orange-400 font-medium">
          🎯 {match.score}%
        </span>
      )}

      {/* Top skill */}
      {creator.skills?.[0] && (
        <span className="text-[10px] text-white/40 truncate w-full">
          {creator.skills[0]}
        </span>
      )}
    </Link>
  )
}
