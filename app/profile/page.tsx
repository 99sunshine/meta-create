'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { useCreateFlow } from '@/components/providers/CreateFlowProvider'
import { Button } from '@/components/ui/button'
import { createClient } from '@/supabase/utils/client'
import type { UserProfile } from '@/types'
import type { TeamWithMembers } from '@/types'
import { TeamsRepository } from '@/supabase/repos/teams'
import { WorksRepository } from '@/supabase/repos/works'
import type { WorkWithCreator } from '@/types'
import { MeProfileSection, MeTeamPill, MeWorkPreviewCard } from '@/components/features/profile/MeProfileRows'

// ── Skill chip 4-color system (Figma Me page) ────────────────────────────────
const SKILL_COLORS = {
  teal: 'bg-[rgba(15,134,136,0.2)] border-[rgba(15,134,136,0.5)] text-[#70b7b8]',
  purple: 'bg-[rgba(115,27,209,0.2)] border-[rgba(115,27,209,0.5)] text-[#b98de8]',
  orange: 'bg-[rgba(223,112,21,0.2)] border-[rgba(223,112,21,0.5)] text-[#efb88a]',
  blue: 'bg-[rgba(21,55,223,0.2)] border-[rgba(21,55,223,0.5)] text-[#8a9bef]',
}

const SKILL_COLOR_MAP: Record<string, keyof typeof SKILL_COLORS> = {
  // teal — engineering/tech
  'Full-Stack Dev': 'teal', 'Full-Stack': 'teal', 'Backend': 'teal', 'Frontend': 'teal',
  'Mobile Dev': 'teal', 'DevOps': 'teal', 'AI / ML': 'teal', 'Data Science': 'teal',
  'Engineering': 'teal', 'Web Dev': 'teal', 'iOS': 'teal', 'Android': 'teal',
  // purple — design/creative
  'UI Design': 'purple', 'UX Design': 'purple', 'Figma': 'purple', 'Product Design': 'purple',
  'Brand Identity': 'purple', 'Illustration': 'purple', 'Motion Design': 'purple', 'Creative': 'purple',
  // orange — business/growth
  'Go-to-Market': 'orange', 'Growth': 'orange', 'Marketing': 'orange', 'Business Dev': 'orange',
  'Strategy': 'orange', 'Operations': 'orange', 'Finance': 'orange', 'Sales': 'orange',
  // blue — research/strategy
  'Research': 'blue', 'User Research': 'blue', 'Data Analysis': 'blue', 'Science': 'blue',
  'Writing': 'blue', 'Content': 'blue', 'Policy': 'blue',
}

function skillColor(s: string): string {
  return SKILL_COLORS[SKILL_COLOR_MAP[s] ?? 'teal']
}

// ── Avatar ───────────────────────────────────────────────────────────────────
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

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: UserProfile
  onClose: () => void
  onSaved: () => void
}) {
  const { refreshProfile } = useAuth()
  const supabase = createClient()

  const [name, setName] = useState(profile.name ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [school, setSchool] = useState(profile.school ?? '')
  const [manifesto, setManifesto] = useState(profile.manifesto ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ name, city, school, manifesto, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (err) { setError(err.message); setSaving(false); return }
    await refreshProfile()
    onSaved()
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-5 mb-2"
        style={{ backgroundColor: '#101837' }}>
        <h2 className="mb-4 text-base font-bold text-white">Edit Profile</h2>
        <div className="space-y-3">
          {[
            { label: 'Name', value: name, setter: setName, placeholder: 'Your name' },
            { label: 'City', value: city, setter: setCity, placeholder: 'e.g. Beijing' },
            { label: 'School / Organisation', value: school, setter: setSchool, placeholder: 'e.g. Tsinghua' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-white/50">{label}</label>
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-white/50">Manifesto / Building next</label>
            <textarea
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              rows={3}
              placeholder="What are you building next?"
              className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/60 hover:text-white">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
            className="text-white font-medium" style={{ backgroundColor: '#E7770F' }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { subscribeEntityCreated } = useCreateFlow()
  const { user, sessionUser, loading, profileLoading, logout } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [myTeams, setMyTeams] = useState<TeamWithMembers[]>([])
  const [myWorks, setMyWorks] = useState<WorkWithCreator[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const encodedProfileReturn = encodeURIComponent('/profile')

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (!sessionUser) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDataLoading(true)
    Promise.all([
      new TeamsRepository().getTeamsForUser(sessionUser.id, 20).catch(() => []),
      new WorksRepository().getWorksByUserId(sessionUser.id, 10).catch(() => []),
    ])
      .then(([teams, works]) => {
        setMyTeams(teams as TeamWithMembers[])
        setMyWorks(works as WorkWithCreator[])
      })
      .finally(() => setDataLoading(false))
  }, [sessionUser])

  useEffect(() => {
    if (!sessionUser) return
    return subscribeEntityCreated(() => {
      void new WorksRepository()
        .getWorksByUserId(sessionUser.id, 10)
        .then((works) => setMyWorks(works))
        .catch(() => {})
    })
  }, [sessionUser, subscribeEntityCreated])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">Loading…</p>
      </div>
    )
  }

  if (!sessionUser) return null

  const profile = user
  const displayName = profile?.name?.trim() || sessionUser.email?.split('@')[0] || 'Creator'
  const skills = (profile?.skills ?? []) as string[]
  const tags = (profile?.tags ?? []) as string[]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Top bar (no hamburger) */}
      <div className="h-[60px] flex items-center justify-between px-5" style={{ backgroundColor: '#101837' }}>
        <p className="text-[15px] font-semibold text-white">Me</p>
        <div className="flex items-center gap-2">
          {!profile?.onboarding_complete && (
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="text-xs text-amber-300 border border-amber-500/40 bg-amber-500/10 px-3 py-1 rounded-full"
            >
              完善资料
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
            aria-label="Edit profile"
            title="Edit"
          >
            ✎
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-28">

        {/* ── Profile Header ── */}
        <div className="flex gap-[14px] items-center">
          <Avatar name={displayName} src={profile?.avatar_url} size={80} />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <p className="text-[20px] font-semibold text-white leading-tight truncate">{displayName}</p>
            <div className="flex flex-wrap gap-2">
              {profile?.school && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">
                  {profile.school}
                </span>
              )}
              {profile?.city && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">
                  {profile.city}
                </span>
              )}
            </div>
            {profile?.manifesto && (
              <p className="text-[12px] italic text-[#e6e6e6] leading-snug line-clamp-2">
                &ldquo;{profile.manifesto}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* ── Building next (manifesto vision) ── */}
        {profile?.manifesto && (
          <MeProfileSection title="Building next">
            <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-[14px] py-[12px]">
              <p className="text-[13px] text-[#d1d1d1] leading-relaxed">{profile.manifesto}</p>
            </div>
          </MeProfileSection>
        )}

        {/* ── Looking for (tags in pink) ── */}
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

        {/* ── Skills (4-color system) ── */}
        {skills.length > 0 && (
          <MeProfileSection title="Skills">
            <div className="flex flex-wrap gap-[6px]">
              {skills.map((s) => (
                <span
                  key={s}
                  className={`rounded-[12px] border px-[10px] py-[5px] text-[12px] ${skillColor(s)}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </MeProfileSection>
        )}

        {/* ── My Teams ── */}
        <MeProfileSection
          title="My Teams"
          action={
            <button
              type="button"
              className="text-[12px] text-white/40"
              onClick={() => router.push('/teams')}
            >
              View all ›
            </button>
          }
        >
          {dataLoading ? (
            <div className="flex gap-3">
              {[1, 2].map((i) => <div key={i} className="h-[72px] w-[150px] rounded-[12px] bg-white/5 animate-pulse shrink-0" />)}
            </div>
          ) : myTeams.length === 0 ? (
            <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-4 py-3 flex items-center justify-between">
              <p className="text-[13px] text-white/40">还没有队伍</p>
              <button
                type="button"
                className="text-[12px] text-[#e46d2e]"
                onClick={() => router.push('/teams/create')}
              >
                创建 +
              </button>
            </div>
          ) : (
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {myTeams.map((team) => (
                <MeTeamPill
                  key={team.id}
                  team={team}
                  contextUserId={sessionUser.id}
                  onPress={() => router.push(`/teams/${team.id}?returnTo=${encodedProfileReturn}`)}
                />
              ))}
              <button
                type="button"
                onClick={() => router.push('/teams/create')}
                className="shrink-0 rounded-[12px] border-[0.5px] border-dashed border-white/20 px-[14px] py-[12px] text-[12px] text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
              >
                + 新建队伍
              </button>
            </div>
          )}
        </MeProfileSection>

        {/* ── My Works / Projects ── */}
        <MeProfileSection
          title="My Works / Projects"
          action={
            <button type="button" className="text-[12px] text-white/40">
              View all ›
            </button>
          }
        >
          {dataLoading ? (
            <div className="flex gap-3">
              {[1, 2].map((i) => <div key={i} className="h-[160px] w-[200px] rounded-[12px] bg-white/5 animate-pulse shrink-0" />)}
            </div>
          ) : myWorks.length === 0 ? (
            <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-4 py-3">
              <p className="text-[13px] text-white/40">还没有作品</p>
            </div>
          ) : (
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {myWorks.map((work) => (
                <MeWorkPreviewCard
                  key={work.id}
                  work={work}
                  onPress={() => router.push(`/works/${work.id}?returnTo=${encodedProfileReturn}`)}
                />
              ))}
            </div>
          )}
        </MeProfileSection>

        {/* ── Account ── */}
        <MeProfileSection title="Account">
          <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-[14px] py-[12px] space-y-1">
            <p className="text-[13px] text-white/50">
              Email: <span className="text-white/80">{profile?.email ?? sessionUser.email}</span>
            </p>
            <p className="text-[13px] text-white/50">
              Member since:{' '}
              <span className="text-white/80">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('zh-CN') : '—'}
              </span>
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => router.push('/onboarding')}
            >
              重新建档
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition-colors"
              onClick={logout}
            >
              退出登录
            </button>
          </div>
        </MeProfileSection>

      </div>

      <BottomTabs />

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
