'use client'

import { useState, useEffect, useCallback } from 'react'
import { WorkCard } from './WorkCard'
import { TeamCard } from './TeamCard'
import { useWorks } from '@/hooks/useWorks'
import { useTeams } from '@/hooks/useTeams'
import { useAuth } from '@/hooks/useAuth'
import { scoreTeamMatch, scoreWorkMatch } from '@/lib/matching'
import type { WorkWithCreator, TeamWithMembers } from '@/types'
import type { Role } from '@/types/interfaces/Role'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CommunityFeedProps {
  refreshKey?: number
  contentType?: 'all' | 'teams' | 'works'
  query?: string
  sort?: 'best' | 'new'
  embedded?: boolean
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommunityFeed({
  refreshKey = 0,
  contentType = 'all',
  query = '',
  sort = 'best',
  embedded = false,
}: CommunityFeedProps) {
  const { user } = useAuth()
  const { tr } = useLocale()
  const [toasts, setToasts] = useState<Toast[]>([])
  const [toastSeed, setToastSeed] = useState(0)

  // ── Data fetching ──
  const { works, loading: worksLoading, error: worksError, refetch: refetchWorks } = useWorks({ limit: 50 })
  const { teams, loading: teamsLoading, error: teamsError, joinTeam, joiningTeamId, refetch: refetchTeams } = useTeams({ openOnly: true, limit: 50 })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableRefetchWorks = useCallback(() => refetchWorks(), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableRefetchTeams = useCallback(() => refetchTeams(), [])

  useEffect(() => {
    if (refreshKey > 0) {
      stableRefetchWorks()
      stableRefetchTeams()
    }
  }, [refreshKey, stableRefetchWorks, stableRefetchTeams])

  const showToast = (message: string, type: Toast['type']) => {
    const id = toastSeed + 1
    setToastSeed(id)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }

  const handleJoinTeam = async (teamId: string, role: Role) => {
    if (!user) {
      showToast('Please log in to join a team.', 'error')
      return
    }
    try {
      await joinTeam(teamId, user.id, role)
      showToast('You have joined the team!', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to join team', 'error')
    }
  }

  type FeedItem = { type: 'work' | 'team'; item: WorkWithCreator | TeamWithMembers; matchScore: number; matchReasons: string[] }

  // ── Client-side filtering ──
  const applyFilters = (): FeedItem[] => {
    const normalizedQuery = (query ?? '').trim().toLowerCase()
    const activeContentType = contentType ?? 'all'

    const workItems: FeedItem[] = works
      .filter((w) => {
        if (activeContentType === 'teams') return false
        const creator = w.creator
        if (!matchesSearch(normalizedQuery, [w.title, w.description, creator.name, ...(w.tags ?? [])])) return false
        return true
      })
      .map((w) => {
        const m = scoreWorkMatch(user, w)
        return { type: 'work' as const, item: w, matchScore: m.score, matchReasons: m.topReasons }
      })

    const teamItems: FeedItem[] = teams
      .filter((t) => {
        if (activeContentType === 'works') return false
        if (!matchesSearch(normalizedQuery, [t.name, t.description, ...(t.members?.map((m) => m.role) ?? [])])) return false
        return true
      })
      .map((t) => {
        const m = scoreTeamMatch(user, t)
        return { type: 'team' as const, item: t, matchScore: m.score, matchReasons: m.topReasons }
      })

    const combined: FeedItem[] = [...workItems, ...teamItems]

    if (sort === 'new' || !user) {
      combined.sort((a, b) => getDate(b.item) - getDate(a.item))
    } else {
      combined.sort((a, b) => b.matchScore - a.matchScore || getDate(b.item) - getDate(a.item))
    }

    return combined
  }

  const getDate = (item: WorkWithCreator | TeamWithMembers) =>
    new Date(item.created_at).getTime()

  const loading = worksLoading || teamsLoading
  const fetchError = worksError || teamsError
  const items = applyFilters()
  const hasActiveFilter = Boolean((query ?? '').trim()) || (contentType ?? 'all') !== 'all'

  return (
    <div className="space-y-5">
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-bottom-4 ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-sm flex-1">
            {tr('explore.feedLoadFailed', { message: fetchError })}
          </span>
          <button
            onClick={() => { refetchWorks(); refetchTeams() }}
            className="text-xs text-red-300 underline hover:text-white shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className={embedded ? 'flex flex-col gap-[14px]' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${embedded ? 'h-[128px] rounded-[16px] border border-white/5 bg-white/5' : 'h-64 rounded-lg bg-slate-800/30 border border-slate-700'} animate-pulse`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasActiveFilter ? tr('explore.noMatches') : tr('explore.nothingHereYet')}
          </h3>
          <p className="text-slate-400 max-w-md text-sm">
            {hasActiveFilter
              ? tr('explore.adjustFiltersHint')
              : tr('explore.communityEmptyHint')}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/30">
            {tr('explore.resultsCount', { count: items.length })}
            {hasActiveFilter ? ` ${tr('explore.filteredSuffix')}` : ''}
            {user && sort !== 'new' ? ` ${tr('explore.sortedByMatchSuffix')}` : ''}
          </p>
          <div className={embedded ? 'flex flex-col gap-[14px]' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
            {items.map((item, idx) => (
              <div key={idx}>
                {item.type === 'work' ? (
                  <WorkCard
                    work={item.item as WorkWithCreator}
                    matchScore={user ? item.matchScore : undefined}
                    matchReasons={user ? item.matchReasons : undefined}
                  />
                ) : (
                  <TeamCard
                    team={item.item as TeamWithMembers}
                    currentUserId={user?.id}
                    onJoinTeam={handleJoinTeam}
                    isJoining={joiningTeamId === (item.item as TeamWithMembers).id}
                    matchScore={user ? item.matchScore : undefined}
                    matchReasons={user ? item.matchReasons : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
