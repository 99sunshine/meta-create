'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import TopNav from '@/components/features/layout/TopNav'
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

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const sizeClass = size === 'lg' ? 'h-24 w-24 text-2xl' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-14 w-14 text-base'
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white/20 ${sizeClass}`}
      style={{ background: 'linear-gradient(135deg,#E7770F,#f5a623)' }}
    >
      {initials || '?'}
    </div>
  )
}

// ── Mini WorkCard ─────────────────────────────────────────────────────────────
function MiniWorkCard({ work }: { work: WorkWithCreator }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-4 hover:bg-white/8 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-white line-clamp-1">{work.title}</h4>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/20">
          {work.category}
        </span>
      </div>
      <p className="text-xs text-white/50 line-clamp-2 mb-2">
        {work.description}
      </p>
      {work.tags && work.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {work.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mini TeamCard ─────────────────────────────────────────────────────────────
function MiniTeamCard({ team }: { team: TeamWithMembers }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-4 hover:bg-white/8 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-semibold text-white line-clamp-1">{team.name}</h4>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/20">
          {team.category}
        </span>
      </div>
      <p className="text-xs text-white/50 line-clamp-2">
        {team.description ?? 'No description'}
      </p>
      <p className="mt-1.5 text-xs text-white/30">{team.member_count}/{team.max_members} members</p>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">{title}</h3>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user: currentUser, sessionUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [works, setWorks] = useState<WorkWithCreator[]>([])
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Own profile redirect
  const isOwnProfile = sessionUser?.id === id

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
          new TeamsRepository().getTeamsByOwnerId(id, 10),
        ])
        if (!p) { setNotFound(true); return }
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

  const matchTeam = teams[0] ? scoreTeamMatch(currentUser, teams[0]) : null
  const overallMatch = currentUser && profile
    ? Math.round(
        (
          (works.reduce((acc, w) => acc + scoreWorkMatch(currentUser, w).score, 0) / Math.max(works.length, 1)) +
          (teams.reduce((acc, t) => acc + scoreTeamMatch(currentUser, t).score, 0) / Math.max(teams.length, 1))
        ) / 2
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
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0c1428' }}>
        <p className="text-white/50 text-sm">Loading profile…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: '#0c1428' }}>
        <p className="text-white/50 text-sm">Creator not found.</p>
        <Button onClick={() => router.push('/explore')} variant="ghost" className="text-white/50 hover:text-white text-sm">
          ← Back to Explore
        </Button>
      </div>
    )
  }

  if (!profile) return null
  const displayName = profile.name?.trim() || 'Anonymous'

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0c1428' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars opacity-30" />
        <div className="stars2 opacity-20" />
      </div>

      <div className="relative z-10">
        <TopNav />
        <div className="mx-auto max-w-2xl px-4 pt-20 pb-16 sm:px-6">

          {/* Back link */}
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back
          </button>

          {/* ── Hero card ── */}
          <div
            className="mb-6 rounded-2xl border border-white/10 p-6 sm:p-8"
            style={{ background: 'linear-gradient(135deg, rgba(231,119,15,0.08) 0%, rgba(18,27,62,0.5) 60%)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 gap-4">
              <Avatar name={displayName} size="lg" />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                  {profile.role && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor[profile.role] ?? 'bg-white/10 text-white/70'}`}>
                      {profile.role}
                    </span>
                  )}
                  {overallMatch !== null && overallMatch > 0 && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', border: '1px solid rgba(231,119,15,0.3)' }}
                    >
                      🎯 {overallMatch}% match
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-white/40 mb-3">
                  {profile.school && <span>🎓 {profile.school}</span>}
                  {profile.city && <span>📍 {profile.city}</span>}
                  {profile.availability && (
                    <span className="text-green-400">⚡ {availLabel[profile.availability] ?? profile.availability}</span>
                  )}
                </div>

                {profile.manifesto ? (
                  <p className="text-sm text-white/70 leading-relaxed italic">
                    &ldquo;{profile.manifesto}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-white/30 italic">No manifesto yet.</p>
                )}
              </div>
            </div>

            {/* Connect button */}
            {sessionUser && !isOwnProfile && (
              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  className="text-white font-medium text-xs"
                  style={{ backgroundColor: existingStatus ? '#444' : '#E7770F' }}
                  disabled={!!existingStatus}
                  onClick={() => setCollabOpen(true)}
                >
                  {existingStatus === 'pending'
                    ? '✅ Request Sent'
                    : existingStatus === 'accepted'
                    ? '🤝 Connected'
                    : 'Connect'}
                </Button>
              </div>
            )}
          </div>

          {/* ── Info sections ── */}
          <div className="space-y-6">
            {(profile.skills ?? []).length > 0 && (
              <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                  {(profile.skills ?? []).map((s) => (
                    <Chip key={s} label={s} color="bg-blue-500/15 text-blue-300 border border-blue-500/20" />
                  ))}
                </div>
              </Section>
            )}

            {(profile.interests ?? []).length > 0 && (
              <Section title="Interests">
                <div className="flex flex-wrap gap-2">
                  {(profile.interests ?? []).map((i) => (
                    <Chip key={i} label={i} color="bg-purple-500/15 text-purple-300 border border-purple-500/20" />
                  ))}
                </div>
              </Section>
            )}

            {(profile.tags ?? []).length > 0 && (
              <Section title="Creator Tags">
                <div className="flex flex-wrap gap-2">
                  {(profile.tags ?? []).map((t) => (
                    <Chip key={t} label={t} color="bg-orange-500/15 text-orange-300 border border-orange-500/20" />
                  ))}
                </div>
              </Section>
            )}

            {works.length > 0 && (
              <Section title={`Works (${works.length})`}>
                <div className="grid gap-3">
                  {works.map((w) => <MiniWorkCard key={w.id} work={w} />)}
                </div>
              </Section>
            )}

            {teams.length > 0 && (
              <Section title={`Teams (${teams.length})`}>
                <div className="grid gap-3">
                  {teams.map((t) => <MiniTeamCard key={t.id} team={t} />)}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* Collab request modal */}
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
