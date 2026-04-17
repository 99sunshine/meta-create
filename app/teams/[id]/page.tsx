'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TeamsRepository } from '@/supabase/repos/teams'
import { createClient } from '@/supabase/utils/client'
import type { TeamWithMembers } from '@/types'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/constants/roles'
import type { Role } from '@/types/interfaces/Role'
import { trackEvent } from '@/lib/analytics'

interface TeamWork {
  id: string
  title: string
  description: string | null
  images: string[] | null
  links: string[] | null
  submitted_at: string
}

function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#E7770F,#f5a623)', fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  )
}

export default function TeamDetailPage() {
  const { id: teamId } = useParams<{ id: string }>()
  const router = useRouter()
  const { sessionUser, loading } = useAuth()

  const [team, setTeam] = useState<TeamWithMembers | null>(null)
  const [works, setWorks] = useState<TeamWork[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [joinRoleOpen, setJoinRoleOpen] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (!teamId) return
    setPageLoading(true)
    const loadWorks = async (): Promise<TeamWork[]> => {
      try {
        const { data } = await createClient()
          .from('team_works')
          .select('*')
          .eq('team_id', teamId)
          .order('submitted_at', { ascending: false })
        return (data ?? []) as TeamWork[]
      } catch {
        return []
      }
    }

    Promise.all([
      new TeamsRepository().getTeamById(teamId),
      loadWorks(),
    ])
      .then(([t, w]) => {
        if (!t) setNotFound(true)
        else setTeam(t)
        setWorks(w)
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false))
  }, [teamId])

  const isMember = team?.members?.some((m) => (m as { user_id?: string }).user_id === sessionUser?.id) ?? false
  const isOwner = team?.owner_id === sessionUser?.id

  const handleJoin = async (role: Role) => {
    if (!sessionUser || !teamId) return
    setJoining(true)
    setError('')
    try {
      await new TeamsRepository().joinTeam(teamId, sessionUser.id, role)
      trackEvent('team_joined', { team_id: teamId, role })
      const updated = await new TeamsRepository().getTeamById(teamId)
      if (updated) setTeam(updated)
      setJoinRoleOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加入失败')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!sessionUser || !teamId || isOwner) return
    setLeaving(true)
    try {
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', sessionUser.id)
      router.push('/profile')
    } catch {}
    finally { setLeaving(false) }
  }

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">Loading…</p>
      </div>
    )
  }
  if (notFound || !team) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50">队伍不存在</p>
        <button type="button" className="text-[#e46d2e] text-sm" onClick={() => router.back()}>← 返回</button>
      </div>
    )
  }

  const members = (team.members ?? []) as Array<{ user_id?: string; name?: string; role?: string; avatar_url?: string | null; is_admin?: boolean }>

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/8 sticky top-0 z-10" style={{ backgroundColor: '#101837' }}>
        <button type="button" className="text-white/60 hover:text-white p-1 text-xl" onClick={() => router.back()}>←</button>
        <p className="text-base font-semibold text-white truncate flex-1">{team.name}</p>
        {isOwner && (
          <span className="text-xs text-[#e46d2e] bg-[rgba(228,109,46,0.1)] border border-[rgba(228,109,46,0.3)] rounded-full px-2 py-0.5">
            Lead
          </span>
        )}
      </div>

      <div className="px-5 pb-28 space-y-5">
        {/* Hero card */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-2xl bg-[rgba(228,109,46,0.15)] flex items-center justify-center text-2xl shrink-0">
              🚀
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-white">{team.name}</p>
              {team.category && (
                <span className="inline-block mt-1 text-xs text-[#e46d2e] bg-[rgba(228,109,46,0.1)] border border-[rgba(228,109,46,0.3)] rounded-full px-2 py-0.5">
                  {team.category}
                </span>
              )}
            </div>
          </div>
          {team.description && (
            <p className="mt-3 text-sm text-white/60 leading-relaxed">{team.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-white/30">
            <span>{team.member_count} / {team.max_members} 名成员</span>
            {team.is_open && <span className="text-green-400">招募中</span>}
          </div>
        </div>

        {/* Looking for */}
        {(team.looking_for_roles ?? []).length > 0 && (
          <div>
            <p className="text-[13px] font-semibold text-white mb-2">招募角色</p>
            <div className="flex flex-wrap gap-2">
              {(team.looking_for_roles ?? []).map((r) => (
                <span
                  key={r}
                  className="rounded-[12px] border border-[rgba(209,27,115,0.5)] bg-[rgba(209,27,115,0.2)] px-[10px] py-[5px] text-[12px] text-[#e88dba]"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <p className="text-[13px] font-semibold text-white mb-3">成员 ({members.length})</p>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div
                key={m.user_id ?? i}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3"
              >
                <Avatar name={m.name ?? '?'} src={m.avatar_url} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.name ?? 'Creator'}</p>
                  <p className="text-xs text-white/40">{m.role}</p>
                </div>
                {m.is_admin && (
                  <span className="text-[10px] text-[#e46d2e] bg-[rgba(228,109,46,0.1)] border border-[rgba(228,109,46,0.3)] rounded-full px-2 py-0.5 shrink-0">
                    Lead
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Team Works ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-white">作品 ({works.length})</p>
            {isMember && (
              <button
                type="button"
                className="text-xs text-[#e46d2e] border border-[#e46d2e]/30 rounded-full px-3 py-1"
                onClick={() => router.push(`/teams/${teamId}/works/create`)}
              >
                + 上传作品
              </button>
            )}
          </div>

          {works.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[13px] text-white/30">还没有作品</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {works.map((work) => {
                const thumb = work.images?.[0]
                return (
                  <div
                    key={work.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden"
                  >
                    {thumb && (
                      <img src={thumb} alt={work.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white">{work.title}</p>
                      {work.description && (
                        <p className="text-xs text-white/50 mt-1 leading-snug line-clamp-2">
                          {work.description}
                        </p>
                      )}
                      {(work.links ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(work.links ?? []).filter(Boolean).map((link, i) => (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#e46d2e] underline"
                            >
                              链接 {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* External chat link */}
        {team.external_chat_link && (
          <a
            href={team.external_chat_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            📎 加入团队群聊
          </a>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* CTA */}
        {sessionUser && !isMember && team.is_open && (team.member_count ?? 0) < team.max_members && (
          <Button
            onClick={() => setJoinRoleOpen(true)}
            disabled={joining}
            className="w-full py-3 text-white font-semibold rounded-xl"
            style={{ backgroundColor: '#E7770F' }}
          >
            {joining ? '加入中…' : '申请加入'}
          </Button>
        )}

        {sessionUser && isMember && !isOwner && (
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-40"
          >
            {leaving ? '处理中…' : '退出队伍'}
          </button>
        )}
      </div>

      {/* Join role picker modal */}
      {joinRoleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setJoinRoleOpen(false) }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 p-5 mb-2" style={{ backgroundColor: '#101837' }}>
            <p className="text-sm font-semibold text-white mb-3">选择你的角色</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const Icon = role.icon
                return (
                  <button
                    key={role.name}
                    type="button"
                    disabled={joining}
                    onClick={() => handleJoin(role.name as Role)}
                    className="p-4 rounded-xl border border-white/10 bg-white/5 text-left hover:border-[#E7770F]/50 hover:bg-[#E7770F]/10 transition-all"
                  >
                    <Icon className="w-6 h-6 mb-2 text-slate-400" />
                    <p className="text-sm font-semibold text-white">{role.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{role.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
