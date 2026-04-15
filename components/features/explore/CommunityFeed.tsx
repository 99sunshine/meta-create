'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WorkCard } from './WorkCard'
import { TeamCard } from './TeamCard'
import { FeedToggle } from './FeedToggle'
import { useWorks } from '@/hooks/useWorks'
import { useTeams } from '@/hooks/useTeams'
import { useAuth } from '@/hooks/useAuth'
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

export function CommunityFeed({ refreshKey = 0 }: CommunityFeedProps) {
  const { user } = useAuth()
  const { works, loading: worksLoading, error: worksError, refetch: refetchWorks } = useWorks({ limit: 20 })
  const { teams, loading: teamsLoading, error: teamsError, joinTeam, joiningTeamId, refetch: refetchTeams } = useTeams({ openOnly: true, limit: 20 })
  const [activeFilter, setActiveFilter] = useState<'all' | 'works' | 'teams'>('all')
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)

  // Stable refetch callbacks so they can be safely listed in useEffect deps
  const stableRefetchWorks = useCallback(refetchWorks, [])
  const stableRefetchTeams = useCallback(refetchTeams, [])

  useEffect(() => {
    if (refreshKey > 0) {
      stableRefetchWorks()
      stableRefetchTeams()
    }
  }, [refreshKey, stableRefetchWorks, stableRefetchTeams])

  const showToast = (message: string, type: Toast['type']) => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const loading = worksLoading || teamsLoading
  const fetchError = worksError || teamsError

  const handleJoinTeam = async (teamId: string, role: Role) => {
    if (!user) {
      showToast('Please log in to join a team.', 'error')
      return
    }
    try {
      await joinTeam(teamId, user.id, role)
      showToast('You have joined the team!', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to join team'
      showToast(msg, 'error')
    }
  }

  const filteredItems = () => {
    if (activeFilter === 'works') return works.map(w => ({ type: 'work' as const, item: w }))
    if (activeFilter === 'teams') return teams.map(t => ({ type: 'team' as const, item: t }))

    const combined = [
      ...works.map(w => ({ type: 'work' as const, item: w, date: new Date(w.created_at) })),
      ...teams.map(t => ({ type: 'team' as const, item: t, date: new Date(t.created_at) }))
    ]
    return combined.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const items = filteredItems()

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all animate-in slide-in-from-bottom-4 ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <FeedToggle activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Fetch error banner */}
      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-sm flex-1">
            Could not load feed data: {fetchError}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-lg bg-slate-800/30 animate-pulse border border-slate-700"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
            <span className="text-4xl">🌌</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No {activeFilter === 'all' ? 'content' : activeFilter} yet
          </h3>
          <p className="text-slate-400 max-w-md">
            {activeFilter === 'works'
              ? 'Be the first to share your creative work with the community!'
              : activeFilter === 'teams'
              ? 'Be the first to create a team and start recruiting!'
              : 'The community feed is empty. Start by creating works or teams!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div key={idx}>
              {item.type === 'work' ? (
                <WorkCard work={item.item as WorkWithCreator} />
              ) : (
                <TeamCard
                  team={item.item as TeamWithMembers}
                  currentUserId={user?.id}
                  onJoinTeam={handleJoinTeam}
                  isJoining={joiningTeamId === (item.item as TeamWithMembers).id}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
