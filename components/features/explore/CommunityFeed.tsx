'use client'

import { useState } from 'react'
import { WorkCard } from './WorkCard'
import { TeamCard } from './TeamCard'
import { FeedToggle } from './FeedToggle'
import { useWorks } from '@/hooks/useWorks'
import { useTeams } from '@/hooks/useTeams'
import type { WorkWithCreator, TeamWithMembers } from '@/types'

export function CommunityFeed() {
  const { works, loading: worksLoading, error: worksError } = useWorks({ limit: 20 })
  const { teams, loading: teamsLoading, error: teamsError } = useTeams({ openOnly: true, limit: 20 })
  const [activeFilter, setActiveFilter] = useState<'all' | 'works' | 'teams'>('all')

  const loading = worksLoading || teamsLoading

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

  if (loading) {
    return (
      <div className="space-y-6">
        <FeedToggle activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="h-64 rounded-lg bg-slate-800/30 animate-pulse border border-slate-700"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FeedToggle activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      
      {items.length === 0 ? (
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
                <TeamCard team={item.item as TeamWithMembers} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
