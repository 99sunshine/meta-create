'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { Button } from '@/components/ui/button'
import { ProfileRepository } from '@/supabase/repos/profile'
import { WorksRepository } from '@/supabase/repos/works'
import { TeamsRepository } from '@/supabase/repos/teams'
import type { UserProfile } from '@/types'
import type { WorkWithCreator } from '@/types'
import type { TeamWithMembers } from '@/types'
import { scoreTeamMatch, scoreWorkMatch } from '@/lib/matching'
import { SendCollabModal } from '@/components/features/collab/SendCollabModal'
import { useExistingRequest } from '@/hooks/useCollabRequests'
import { trackEvent } from '@/lib/analytics'
import { MeProfileSection, MeTeamPill, MeWorkPreviewCard } from '@/components/features/profile/MeProfileRows'
import { skillColorClass } from '@/constants/skills'

const SKILL_COLORS = {
  teal: 'bg-[rgba(15,134,136,0.2)] border-[rgba(15,134,136,0.5)] text-[#70b7b8]',
  purple: 'bg-[rgba(115,27,209,0.2)] border-[rgba(115,27,209,0.5)] text-[#b98de8]',
  orange: 'bg-[rgba(223,112,21,0.2)] border-[rgba(223,112,21,0.5)] text-[#efb88a]',
  blue: 'bg-[rgba(21,55,223,0.2)] border-[rgba(21,55,223,0.5)] text-[#8a9bef]',
}

function skillColor(s: string): string {
  return SKILL_COLORS[skillColorClass(s)]
}

function Avatar({ name, src, size = 80 }: { name: string; src?: string | null; size?: number }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#E7770F,#f5a623)',
        fontSize: size * 0.28,
      }}
    >
      {initials}
    </div>
  )
}

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeReturnPath(searchParams.get('returnTo')) ?? '/explore'
  const { user: currentUser, sessionUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [works, setWorks] = useState<WorkWithCreator[]>([])
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const isOwnProfile = sessionUser?.id === id
  const creatorReturn = id ? `/creator/${id}` : '/explore'
  const encodedCreatorReturn = encodeURIComponent(creatorReturn)

  useEffect(() => {
    if (!id) return
    if (isOwnProfile) {
      router.replace('/profile')
      return
    }
    const load = async () => {
      setLoading(true)
      try {
        const [p, w, t] = await Promise.all([
          new ProfileRepository().getProfile(id),
          new WorksRepository().getWorksByUserId(id, 10),
          new TeamsRepository().getTeamsForUser(id, 20),
        ])
        if (!p) {
          setNotFound(true)
          return
        }
        setProfile(p)
        setWorks(w)
        setTeams(t)
        trackEvent('profile_viewed', { viewed_user_id: id })
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isOwnProfile, router])

  const [collabOpen, setCollabOpen] = useState(false)
  const existingStatus = useExistingRequest(sessionUser?.id, id)

  const overallMatch =
    currentUser && profile
      ? Math.round(
          (works.reduce((acc, w) => acc + scoreWorkMatch(currentUser, w).score, 0) / Math.max(works.length, 1) +
            teams.reduce((acc, t) => acc + scoreTeamMatch(currentUser, t).score, 0) / Math.max(teams.length, 1)) /
            2,
        )
      : null

  const roleColor: Record<string, string> = {
    Builder: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    Visionary: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    Strategist: 'bg-green-500/20 text-green-300 border border-green-500/30',
    Connector: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  }

  const availLabel: Record<string, string> = {
    weekends: 'Weekends only',
    evenings: 'Evenings',
    flexible: 'Flexible',
    'full-time': 'Full-time',
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">未找到该创作者</p>
        <Button onClick={() => router.push('/explore')} variant="ghost" className="text-white/50 hover:text-white text-sm">
          ← 返回 Explore
        </Button>
      </div>
    )
  }

  if (!profile || !id) return null
  const displayName = profile.name?.trim() || 'Creator'
  const tags = (profile.tags ?? []) as string[]
  const skills = (profile.skills ?? []) as string[]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      <div className="h-[60px] flex items-center justify-between px-5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            className="text-white/50 hover:text-white text-sm"
            aria-label="返回"
          >
            ←
          </button>
          <p className="text-[15px] font-semibold text-white">创作者</p>
        </div>
      </div>

      <div className="px-5 pb-28">
        <div className="flex gap-[14px] items-center pt-4">
          <Avatar name={displayName} src={profile.avatar_url} size={80} />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[20px] font-semibold text-white leading-tight truncate">{displayName}</p>
              {profile.role && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${roleColor[profile.role] ?? 'bg-white/10 text-white/70'}`}>
                  {profile.role}
                </span>
              )}
              {overallMatch !== null && overallMatch > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold shrink-0"
                  style={{
                    backgroundColor: 'rgba(231,119,15,0.15)',
                    color: '#f5a623',
                    border: '1px solid rgba(231,119,15,0.3)',
                  }}
                >
                  🎯 {overallMatch}%
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.school && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">{profile.school}</span>
              )}
              {profile.city && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">{profile.city}</span>
              )}
              {profile.hackathon_track && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">
                  Track: {profile.hackathon_track}
                </span>
              )}
              {profile.availability && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-green-400">
                  ⚡ {availLabel[profile.availability] ?? profile.availability}
                </span>
              )}
            </div>
            {profile.manifesto && (
              <p className="text-[12px] italic text-[#e6e6e6] leading-snug line-clamp-3">&ldquo;{profile.manifesto}&rdquo;</p>
            )}
          </div>
        </div>

        {sessionUser && !isOwnProfile && (
          <div className="mt-4">
            <Button
              size="sm"
              className="text-white font-medium text-xs"
              style={{ backgroundColor: existingStatus ? '#444' : '#E7770F' }}
              disabled={!!existingStatus}
              onClick={() => setCollabOpen(true)}
            >
              {existingStatus === 'pending'
                ? '已发送请求'
                : existingStatus === 'accepted'
                  ? '已连接'
                  : 'Connect'}
            </Button>
          </div>
        )}

        {tags.length > 0 && (
          <MeProfileSection title="Looking for">
            <div className="flex flex-wrap gap-[6px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[12px] border border-[rgba(209,27,115,0.5)] bg-[rgba(209,27,115,0.2)] px-[10px] py-[5px] text-[12px] text-[#e88dba]"
                >
                  {t}
                </span>
              ))}
            </div>
          </MeProfileSection>
        )}

        {skills.length > 0 && (
          <MeProfileSection title="Skills">
            <div className="flex flex-wrap gap-[6px]">
              {skills.map((s) => (
                <span key={s} className={`rounded-[12px] border px-[10px] py-[5px] text-[12px] ${skillColor(s)}`}>
                  {s}
                </span>
              ))}
            </div>
          </MeProfileSection>
        )}

        {teams.length > 0 && (
          <MeProfileSection title={`Teams (${teams.length})`}>
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {teams.map((t) => (
                <MeTeamPill
                  key={t.id}
                  team={t}
                  contextUserId={id}
                  onPress={() => router.push(`/teams/${t.id}?returnTo=${encodedCreatorReturn}`)}
                />
              ))}
            </div>
          </MeProfileSection>
        )}

        {works.length > 0 && (
          <MeProfileSection title={`Works (${works.length})`}>
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {works.map((w) => (
                <MeWorkPreviewCard
                  key={w.id}
                  work={w}
                  onPress={() => router.push(`/works/${w.id}?returnTo=${encodedCreatorReturn}`)}
                />
              ))}
            </div>
          </MeProfileSection>
        )}
      </div>

      <BottomTabs />

      {sessionUser && !isOwnProfile && profile && (
        <SendCollabModal
          open={collabOpen}
          onClose={() => setCollabOpen(false)}
          senderId={sessionUser.id}
          receiverId={id}
          receiverName={displayName}
          receiverRole={profile.role ?? undefined}
          senderRole={currentUser?.role ?? undefined}
          senderName={currentUser?.name ?? sessionUser.email?.split('@')[0]}
          matchScore={overallMatch ?? undefined}
        />
      )}
    </div>
  )
}
