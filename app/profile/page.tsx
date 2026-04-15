'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import TopNav from '@/components/features/layout/TopNav'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/types'
import { CollabInbox } from '@/components/features/collab/CollabInbox'

// ──────────────────────────────────────
// Small helper: coloured avatar initials
// ──────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg ring-2 ring-white/20"
      style={{ background: 'linear-gradient(135deg,#E7770F,#f5a623)' }}
    >
      {initials || '?'}
    </div>
  )
}

// Chip row for skills / interests / tags
function ChipRow({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return <p className="text-sm text-white/40 italic">—</p>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

// Section card wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ──────────────────────────────────────
// Inline edit modal for quick profile updates
// ──────────────────────────────────────
function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: UserProfile
  onClose: () => void
  onSaved: (updated: Partial<UserProfile>) => void
}) {
  const { refreshProfile } = useAuth()
  const { createClient } = require('@/supabase/utils/client')
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
    const updates = { name, city, school, manifesto }
    const { error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    await refreshProfile()
    onSaved(updates)
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-6"
           style={{ backgroundColor: '#121B3E' }}>
        <h2 className="mb-5 text-lg font-bold text-white">Edit Profile</h2>

        <div className="space-y-4">
          {[
            { label: 'Name', value: name, setter: setName, placeholder: 'Your name' },
            { label: 'City', value: city, setter: setCity, placeholder: 'e.g. San Francisco' },
            { label: 'School / Organisation', value: school, setter: setSchool, placeholder: 'e.g. Stanford University' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-white/60">{label}</label>
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-orange-400 focus:outline-none"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs text-white/60">Manifesto</label>
            <textarea
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              rows={3}
              placeholder="Describe your creator journey…"
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-orange-400 focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-5 flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}
                  className="text-white/60 hover:text-white">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
                  className="text-white font-medium"
                  style={{ backgroundColor: '#E7770F' }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────
// Main ProfilePage
// ──────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { user, sessionUser, loading, profileLoading } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.push('/login')
    }
  }, [loading, sessionUser, router])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center"
           style={{ backgroundColor: '#121B3E' }}>
        <p className="text-white/60 text-sm">Loading…</p>
      </div>
    )
  }

  if (!sessionUser) return null

  // If user hasn't finished onboarding, redirect there
  if (!profileLoading && user && !user.onboarding_complete) {
    // Show profile with an "incomplete" notice instead of hard-redirecting
  }

  const profile = user
  const displayName = profile?.name?.trim() || sessionUser.email?.split('@')[0] || 'Anonymous'

  const skills = profile?.skills ?? []
  const interests = profile?.interests ?? []
  const tags = profile?.tags ?? []

  const roleColor: Record<string, string> = {
    Builder: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    Designer: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    Researcher: 'bg-green-500/20 text-green-300 border border-green-500/30',
    Hustler: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    Creator: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  }
  const roleBadge = roleColor[profile?.role ?? ''] ?? 'bg-white/10 text-white/70'

  const availabilityLabel: Record<string, string> = {
    weekends: 'Weekends only',
    evenings: 'Evenings',
    flexible: 'Flexible',
    'full-time': 'Full-time',
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0c1428' }}>
      {/* Subtle star bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars opacity-40" />
        <div className="stars2 opacity-30" />
      </div>

      <div className="relative z-10">
        <TopNav />

        <div className="mx-auto max-w-2xl px-4 pt-20 pb-16 sm:px-6">

          {/* ── Hero card ── */}
          <div className="mb-6 rounded-2xl border border-white/10 p-6 sm:p-8"
               style={{ background: 'linear-gradient(135deg, rgba(231,119,15,0.1) 0%, rgba(18,27,62,0.6) 60%)' }}>

            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 gap-4">
              <Avatar name={displayName} />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-white truncate">{displayName}</h1>
                  {profile?.role && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge}`}>
                      {profile.role}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-white/50 mb-3">
                  {profile?.school && <span>🎓 {profile.school}</span>}
                  {profile?.city && <span>📍 {profile.city}</span>}
                  {profile?.availability && (
                    <span className="text-green-400">
                      ⚡ {availabilityLabel[profile.availability] ?? profile.availability}
                    </span>
                  )}
                </div>

                {profile?.manifesto ? (
                  <p className="text-sm text-white/70 leading-relaxed">
                    &ldquo;{profile.manifesto}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-white/30 italic">No manifesto yet.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setEditOpen(true)}
                className="text-white font-medium text-xs"
                style={{ backgroundColor: '#E7770F' }}
              >
                Edit Profile
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push('/onboarding')}
                className="text-white/60 hover:text-white text-xs border border-white/10 hover:bg-white/10"
              >
                Full Re-onboard
              </Button>
            </div>

            {!profile?.onboarding_complete && (
              <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                Your profile is incomplete. Complete onboarding to unlock co-creator matching.
              </div>
            )}
          </div>

          {/* ── Info sections ── */}
          <div className="space-y-4">
            <Section title="Skills">
              <ChipRow
                items={skills}
                color="bg-blue-500/15 text-blue-300 border border-blue-500/20"
              />
            </Section>

            <Section title="Interests">
              <ChipRow
                items={interests}
                color="bg-purple-500/15 text-purple-300 border border-purple-500/20"
              />
            </Section>

            <Section title="Creator Tags">
              <ChipRow
                items={tags}
                color="bg-orange-500/15 text-orange-300 border border-orange-500/20"
              />
            </Section>

            {profile?.collab_style && (
              <Section title="Collab Style">
                <p className="text-sm text-white/70">{profile.collab_style}</p>
              </Section>
            )}

            <Section title="Account">
              <div className="text-sm text-white/50 space-y-1">
                <p>Email: <span className="text-white/80">{profile?.email ?? sessionUser.email}</span></p>
                <p>Member since: <span className="text-white/80">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </span></p>
              </div>
            </Section>

            {/* Collab inbox */}
            <Section title="Collab Requests">
              <CollabInbox userId={sessionUser.id} />
            </Section>
          </div>
        </div>
      </div>

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
