'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { TeamsRepository } from '@/supabase/repos/teams'
import type { TeamWithMembers } from '@/types'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

function TeamListCard({ team, onClick }: { team: TeamWithMembers; onClick: () => void }) {
  const members = (team.members ?? []) as Array<{ id?: string; name?: string; avatar_url?: string | null; is_admin?: boolean }>
  const owner = members.find((m) => m.is_admin)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 space-y-3 hover:border-white/15 hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white truncate">{team.name}</p>
          {team.category && (
            <span className="inline-block mt-1 text-[11px] text-[#e46d2e] bg-[rgba(228,109,46,0.1)] border border-[rgba(228,109,46,0.3)] rounded-full px-2 py-0.5">
              {team.category}
            </span>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="text-[11px] text-white/40">{team.member_count ?? members.length} / {team.max_members} 人</span>
          {team.is_open && (
            <span className="text-[10px] text-green-400 border border-green-400/30 rounded-full px-1.5 py-0.5">招募中</span>
          )}
        </div>
      </div>

      {team.description && (
        <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed">{team.description}</p>
      )}

      {(team.looking_for_roles ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(team.looking_for_roles as string[]).slice(0, 4).map((r) => (
            <span key={r} className="text-[10px] rounded-full border border-[rgba(209,27,115,0.4)] bg-[rgba(209,27,115,0.1)] px-2 py-0.5 text-[#e88dba]">
              {r}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <div className="flex -space-x-1.5">
          {members.slice(0, 5).map((m, i) => (
            <div
              key={m.id ?? i}
              className="h-6 w-6 rounded-full border border-[#101837] bg-white/10 flex items-center justify-center text-[9px] text-white/70 font-semibold overflow-hidden"
            >
              {m.avatar_url ? (
                <img src={m.avatar_url} alt={m.name ?? ''} className="h-full w-full object-cover" />
              ) : (
                (m.name ?? '?')[0].toUpperCase()
              )}
            </div>
          ))}
        </div>
        {owner && (
          <p className="text-[11px] text-white/30 truncate">by {owner.name ?? '创建者'}</p>
        )}
      </div>
    </button>
  )
}

export default function TeamsPage() {
  const router = useRouter()
  const { sessionUser, loading } = useAuth()
  const { tr } = useLocale()
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'open' | 'all'>('open')

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    const repo = new TeamsRepository()
    setPageLoading(true)
    const load = tab === 'open' ? repo.getOpenTeams(40) : repo.getRecentTeams(40)
    load
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setPageLoading(false))
  }, [tab])

  const visible = useMemo(() => {
    if (!query.trim()) return teams
    const q = query.trim().toLowerCase()
    return teams.filter((t) =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      (t.looking_for_roles ?? []).some((r) => String(r).toLowerCase().includes(q))
    )
  }, [teams, query])

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#101837' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ backgroundColor: '#101837' }}>
        <div className="flex items-center justify-between px-5 h-[60px]">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.back()} className="text-white/50 hover:text-white text-sm">←</button>
            <p className="text-[15px] font-semibold text-white">队伍广场</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              className="rounded-xl px-3 py-1.5 text-[12px] font-medium text-white"
              style={{ backgroundColor: '#E7770F' }}
              onClick={() => router.push('/teams/create')}
            >
              + 创建队伍
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3">
          {([['open', '招募中'], ['all', '全部']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tab === key
                  ? 'bg-[#E7770F] text-white'
                  : 'bg-white/8 text-white/50 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索队伍名称、类型、招募角色…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none"
          />
        </div>
      </div>

      <main className="px-4 pt-4 space-y-3">
        {pageLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[140px] rounded-2xl bg-white/[0.04] animate-pulse" />
          ))
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-white/40 text-sm">{query ? '没有匹配的队伍' : '暂无队伍'}</p>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#E7770F' }}
              onClick={() => router.push('/teams/create')}
            >
              创建第一个队伍
            </button>
          </div>
        ) : (
          visible.map((team) => (
            <TeamListCard
              key={team.id}
              team={team}
              onClick={() => router.push(`/teams/${team.id}?returnTo=/teams`)}
            />
          ))
        )}
      </main>

      <BottomTabs />
    </div>
  )
}
