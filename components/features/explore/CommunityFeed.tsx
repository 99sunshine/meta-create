'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { WorkCard } from './WorkCard'
import { TeamCard } from './TeamCard'
import { SearchFilterBar, type ExploreFilters } from './SearchFilterBar'
import { useWorks } from '@/hooks/useWorks'
import { useTeams } from '@/hooks/useTeams'
import { useAuth } from '@/hooks/useAuth'
import { scoreTeamMatch, scoreWorkMatch } from '@/lib/matching'
import { NewCreatorsSection } from './NewCreatorsSection'
import type { WorkWithCreator, TeamWithMembers } from '@/types'
import type { Role } from '@/types/interfaces/Role'

interface CommunityFeedProps {
  refreshKey?: number
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

export function CommunityFeed({ refreshKey = 0 }: CommunityFeedProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // ── Initialise filters from URL params ──
  const [filters, setFilters] = useState<ExploreFilters>({
    searchQuery: searchParams.get('q') ?? '',
    roleFilter: searchParams.get('role') ?? '',
    categoryFilter: searchParams.get('category') ?? '',
    availabilityFilter: searchParams.get('availability') ?? '',
    trackFilter: searchParams.get('track') ?? '',
    contentType: (searchParams.get('type') as ExploreFilters['contentType']) ?? 'all',
  })

  // ── Sync URL when filters change ──
  const updateUrl = useCallback(
    (next: ExploreFilters) => {
      const params = new URLSearchParams()
      if (next.searchQuery) params.set('q', next.searchQuery)
      if (next.roleFilter) params.set('role', next.roleFilter)
      if (next.categoryFilter) params.set('category', next.categoryFilter)
      if (next.availabilityFilter) params.set('availability', next.availabilityFilter)
      if (next.trackFilter) params.set('track', next.trackFilter)
      if (next.contentType !== 'all') params.set('type', next.contentType)
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, pathname],
  )

  const handleFilterChange = (delta: Partial<ExploreFilters>) => {
    const next = { ...filters, ...delta }
    setFilters(next)
    updateUrl(next)
  }

  // ── Data fetching ──
  const { works, loading: worksLoading, error: worksError, refetch: refetchWorks } = useWorks({ limit: 50 })
  const { teams, loading: teamsLoading, error: teamsError, joinTeam, joiningTeamId, refetch: refetchTeams } = useTeams({ openOnly: true, limit: 50 })

  const stableRefetchWorks = useCallback(refetchWorks, [])
  const stableRefetchTeams = useCallback(refetchTeams, [])

  useEffect(() => {
    if (refreshKey > 0) {
      stableRefetchWorks()
      stableRefetchTeams()
    }
  }, [refreshKey, stableRefetchWorks, stableRefetchTeams])

  // ── Toasts ──
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  const showToast = (message: string, type: Toast['type']) => {
    const id = ++toastIdRef.current
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
    const { searchQuery, roleFilter, categoryFilter, availabilityFilter, trackFilter, contentType } = filters

    const workItems: FeedItem[] = works
      .filter((w) => {
        if (contentType === 'teams') return false
        const creator = w.creator
        if (roleFilter && creator.role !== roleFilter) return false
        if (categoryFilter && w.category !== categoryFilter) return false
        if (!matchesSearch(searchQuery, [w.title, w.description, creator.name, ...(w.tags ?? [])])) return false
        // availability / track filter: apply on creator fields if available
        const creatorAny = creator as unknown as Record<string, unknown>
        if (availabilityFilter && creatorAny.availability && creatorAny.availability !== availabilityFilter) return false
        if (trackFilter && creatorAny.hackathon_track && creatorAny.hackathon_track !== trackFilter) return false
        return true
      })
      .map((w) => {
        const m = scoreWorkMatch(user, w)
        return { type: 'work' as const, item: w, matchScore: m.score, matchReasons: m.topReasons }
      })

    const teamItems: FeedItem[] = teams
      .filter((t) => {
        if (contentType === 'works') return false
        if (categoryFilter && t.category !== categoryFilter) return false
        if (trackFilter) {
          const teamAny = t as unknown as Record<string, unknown>
          if (teamAny.event_track && teamAny.event_track !== trackFilter) return false
        }
        if (roleFilter) {
          const hasRole = t.members?.some((m) => m.role === roleFilter)
          if (!hasRole) return false
        }
        if (!matchesSearch(searchQuery, [t.name, t.description, ...(t.members?.map((m) => m.role) ?? [])])) return false
        return true
      })
      .map((t) => {
        const m = scoreTeamMatch(user, t)
        return { type: 'team' as const, item: t, matchScore: m.score, matchReasons: m.topReasons }
      })

    const combined: FeedItem[] = [...workItems, ...teamItems]

    if (user) {
      combined.sort((a, b) => b.matchScore - a.matchScore || getDate(b.item) - getDate(a.item))
    } else {
      combined.sort((a, b) => getDate(b.item) - getDate(a.item))
    }

    return combined
  }

  const getDate = (item: WorkWithCreator | TeamWithMembers) =>
    new Date(item.created_at).getTime()

  const loading = worksLoading || teamsLoading
  const fetchError = worksError || teamsError
  const items = applyFilters()
  const hasActiveFilter =
    filters.searchQuery ||
    filters.roleFilter ||
    filters.categoryFilter ||
    filters.availabilityFilter ||
    filters.trackFilter ||
    filters.contentType !== 'all'

  return (
    <div className="space-y-5">
      {/* New Creators This Week */}
      <NewCreatorsSection />

      {/* Toast notifications */}
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

      {/* Search + filter bar */}
      <SearchFilterBar filters={filters} onChange={handleFilterChange} />

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-sm flex-1">
            Could not load feed: {fetchError}
          </span>
          <button
            onClick={() => { refetchWorks(); refetchTeams() }}
            className="text-xs text-red-300 underline hover:text-white shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-slate-800/30 animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
            <span className="text-4xl">{hasActiveFilter ? '🔭' : '🌌'}</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasActiveFilter ? 'No matches found' : 'Nothing here yet'}
          </h3>
          <p className="text-slate-400 max-w-md text-sm">
            {hasActiveFilter
              ? 'Try adjusting your search or filters to discover more creators.'
              : 'The community feed is empty. Start by creating works or teams!'}
          </p>
          {hasActiveFilter && (
            <button
              onClick={() => handleFilterChange({ searchQuery: '', roleFilter: '', categoryFilter: '', contentType: 'all' })}
              className="mt-4 text-sm text-orange-400 hover:text-orange-300 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Result count */}
          <p className="text-xs text-white/30">
            {items.length} result{items.length !== 1 ? 's' : ''}
            {hasActiveFilter ? ' — filtered' : ''}
            {user ? ' · sorted by match' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
