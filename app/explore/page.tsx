'use client'

import { useEffect, useMemo, useState, Suspense, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { CreateModal } from '@/components/features/create'
import { Button } from '@/components/ui/button'
import { CreatorsFeed } from '@/components/features/explore/CreatorsFeed'
import { SwipeStack, type SwipeDirection } from '@/components/features/swipe/SwipeStack'
import { SwipeConfirmModal } from '@/components/features/swipe/SwipeConfirmModal'
import { ProfileRepository } from '@/supabase/repos/profile'
import { CollabRepository } from '@/supabase/repos/collab'
import type { UserProfile } from '@/types'

export default function ExplorePage() {
  const { user, sessionUser, loading, profileLoading } = useAuth()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'team' | 'work'>('team')
  const [feedRefreshKey, setFeedRefreshKey] = useState(0)
  const [createPickerOpen, setCreatePickerOpen] = useState(false)
  const [swipeMode, setSwipeMode] = useState(false)
  const [swipeProfiles, setSwipeProfiles] = useState<UserProfile[]>([])
  const [swipeLoading, setSwipeLoading] = useState(false)
  const [pendingSwipe, setPendingSwipe] = useState<{ profile: UserProfile; iceBreaker: string } | null>(null)
  const [swipeSending, setSwipeSending] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'best' | 'new'>('best')
  const [skill, setSkill] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [picker, setPicker] = useState<null | 'skill' | 'role' | 'location'>(null)

  const SKILL_OPTIONS = useMemo(
    () => ['UI Design', 'Figma', 'Full-Stack', 'AI / ML', 'Backend', 'Research', 'Go-to-Market', 'Brand Identity'],
    [],
  )
  const ROLE_OPTIONS = useMemo(() => ['Visionary', 'Builder', 'Strategist', 'Connector'], [])
  const LOCATION_OPTIONS = useMemo(() => ['NYC', 'SF', 'London', 'Beijing', 'Shanghai', 'Shenzhen'], [])

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  // Load swipe profiles (exclude already-swiped from localStorage)
  const loadSwipeProfiles = useCallback(async () => {
    if (!sessionUser) return
    setSwipeLoading(true)
    try {
      const skippedRaw = localStorage.getItem('mc_swiped') ?? '[]'
      const skipped: string[] = JSON.parse(skippedRaw)
      const repo = new ProfileRepository()
      const all = await repo.listCreators(30)
      const filtered = all.filter(
        (p) => p.id !== sessionUser.id && !skipped.includes(p.id),
      )
      setSwipeProfiles(filtered.slice(0, 10))
    } catch {}
    finally { setSwipeLoading(false) }
  }, [sessionUser])

  const handleEnterSwipe = useCallback(() => {
    loadSwipeProfiles()
    setSwipeMode(true)
  }, [loadSwipeProfiles])

  const handleSwipe = useCallback(
    async (profile: UserProfile, dir: SwipeDirection) => {
      // Record to localStorage
      const skippedRaw = localStorage.getItem('mc_swiped') ?? '[]'
      const skipped: string[] = JSON.parse(skippedRaw)
      if (!skipped.includes(profile.id)) {
        localStorage.setItem('mc_swiped', JSON.stringify([...skipped, profile.id]))
      }

      if (dir === 'right') {
        // Generate icebreaker
        let iceBreaker = `Hi ${profile.name ?? 'there'}, your profile really caught my eye! I'd love to connect and explore if we could collaborate.`
        try {
          const res = await fetch('/api/ai/icebreaker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderName: user?.name ?? sessionUser?.email,
              senderRole: user?.role ?? undefined,
              receiverName: profile.name,
              receiverRole: profile.role ?? undefined,
              type: 'just_connect',
            }),
          })
          if (res.ok) {
            const data = await res.json() as { text?: string }
            if (data.text) iceBreaker = data.text
          }
        } catch {}
        setPendingSwipe({ profile, iceBreaker })
      }
    },
    [user, sessionUser],
  )

  const handleConfirmSwipe = useCallback(
    async (message: string) => {
      if (!pendingSwipe || !sessionUser) return
      setSwipeSending(true)
      try {
        await new CollabRepository().sendRequest({
          senderId: sessionUser.id,
          receiverId: pendingSwipe.profile.id,
          type: 'just_connect',
          message,
          iceBreakerText: message,
        })
      } catch (e) {
        console.error('swipe send failed', e)
      } finally {
        setSwipeSending(false)
        setPendingSwipe(null)
      }
    },
    [pendingSwipe, sessionUser],
  )

  if (loading || profileLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#0c1428' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="stars opacity-40" />
          <div className="stars2 opacity-30" />
        </div>
        <p className="text-white/60 relative z-10 text-sm">Loading…</p>
      </div>
    )
  }

  if (!sessionUser) return null

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#101837' }}
    >
      <div className="relative z-10">
        {/* Top Bar (Figma: Search + View Toggle) */}
        <div className="sticky top-0 z-40 h-[60px] bg-[#101837] px-4 py-[14px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[32px] flex-1 items-center gap-2 rounded-[20px] bg-white/10 px-[14px]">
              <span aria-hidden className="inline-block h-2 w-2 rounded-sm bg-[#6b7280]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators..."
                className="w-full bg-transparent text-[13px] text-white placeholder:text-[#6b7280] focus:outline-none"
                aria-label="Search creators"
              />
            </div>

            <div className="flex items-center rounded-lg bg-white/10 p-1">
              <button
                type="button"
                className={`rounded-lg px-2 py-1 text-sm transition-colors ${!swipeMode ? 'bg-white/20 text-white' : 'text-white/50'}`}
                aria-label="List mode"
                onClick={() => setSwipeMode(false)}
              >
                ≡
              </button>
              <button
                type="button"
                className={`rounded-lg px-2 py-1 text-sm transition-colors ${swipeMode ? 'bg-white/20 text-white' : 'text-white/50'}`}
                aria-label="Swipe mode"
                onClick={handleEnterSwipe}
              >
                ⇄
              </button>
            </div>
          </div>
        </div>

        {/* MetaFire Progress Bar (Figma visual placeholder) */}
        <div className="h-10 bg-[#101837] px-4">
          <div className="h-px bg-white/10" />
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="h-[5px] w-[5px] rounded-full bg-[#e46d2e]" />
                <span className="h-[5px] w-[5px] rounded-full bg-[#e46d2e]/70" />
                <span className="h-[5px] w-[5px] rounded-full bg-[#e46d2e]/50" />
                <span className="h-[5px] w-[5px] rounded-full bg-[#e46d2e]/30" />
              </div>
              <span className="text-[11px] font-medium text-white">Lv2 Spark</span>
              <div className="h-1 w-[193px] rounded-full bg-white/10">
                <div className="h-1 w-[60%] rounded-full bg-[#e46d2e] shadow-[0px_0px_6px_rgba(228,109,46,0.5)]" />
              </div>
            </div>
            <span className="text-[10px] text-white/45">180 / 300 XP</span>
          </div>
        </div>

        {/* Filter Row (Figma) */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className="shrink-0 rounded-[14px] border border-[#e46d2e]/40 bg-[#e46d2e]/15 px-3 py-[5px] text-[12px] font-medium text-[#e46d2e]"
              onClick={() => setSort('best')}
            >
              Best Match
            </button>
            <button
              type="button"
              className="shrink-0 rounded-[14px] bg-white/10 px-3 py-[5px] text-[12px] text-[#6b7280]"
              onClick={() => setPicker('skill')}
            >
              {skill ? `${skill} ▾` : 'Skill ▾'}
            </button>
            <button
              type="button"
              className="shrink-0 rounded-[14px] bg-white/10 px-3 py-[5px] text-[12px] text-[#6b7280]"
              onClick={() => setPicker('role')}
            >
              {role ? `${role} ▾` : 'Role ▾'}
            </button>
            <button
              type="button"
              className="shrink-0 rounded-[14px] bg-white/10 px-3 py-[5px] text-[12px] text-[#6b7280]"
              onClick={() => setPicker('location')}
            >
              {location ? `${location} ▾` : 'Location ▾'}
            </button>
            <button
              type="button"
              className="shrink-0 rounded-[14px] bg-white/10 px-3 py-[5px] text-[12px] text-[#6b7280]"
              onClick={() => setSort('new')}
            >
              Latest
            </button>
          </div>
        </div>

        {/* Incomplete-profile banner (keep, but align spacing) */}
        {user && !user.onboarding_complete && (
          <div className="mt-3 bg-amber-500/10 border-y border-amber-500/30 px-4 py-2 text-center">
            <span className="text-amber-300 text-sm">
              你的资料还未完善。{' '}
              <button
                onClick={() => router.push('/onboarding')}
                className="underline text-amber-200 hover:text-white font-medium"
              >
                去完善
              </button>
            </span>
          </div>
        )}

        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-4 pb-28">
          <Suspense
            fallback={
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[128px] rounded-[16px] border border-white/5 bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <CreatorsFeed query={query} role={role} skill={skill} location={location} sort={sort} />
          </Suspense>
        </main>
      </div>

      <BottomTabs
        onCreate={() => {
          setCreatePickerOpen(true)
        }}
      />

      {createPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreatePickerOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121B3E] p-4">
            <p className="text-sm font-medium text-white mb-3">创建</p>
            <div className="flex gap-2">
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: '#3b82f6' }}
                onClick={() => {
                  setModalType('team')
                  setCreatePickerOpen(false)
                  setModalOpen(true)
                }}
              >
                + Team
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: '#a855f7' }}
                onClick={() => {
                  setModalType('work')
                  setCreatePickerOpen(false)
                  setModalOpen(true)
                }}
              >
                + Work
              </Button>
            </div>
          </div>
        </div>
      )}

      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPicker(null)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121B3E] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">
                {picker === 'skill' ? 'Skill' : picker === 'role' ? 'Role' : 'Location'}
              </p>
              <button
                type="button"
                className="text-xs text-white/50 underline"
                onClick={() => {
                  if (picker === 'skill') setSkill('')
                  if (picker === 'role') setRole('')
                  if (picker === 'location') setLocation('')
                  setPicker(null)
                }}
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(picker === 'skill' ? SKILL_OPTIONS : picker === 'role' ? ROLE_OPTIONS : LOCATION_OPTIONS).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="rounded-[14px] bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15"
                  onClick={() => {
                    if (picker === 'skill') setSkill(opt)
                    if (picker === 'role') setRole(opt)
                    if (picker === 'location') setLocation(opt)
                    setPicker(null)
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white"
                onClick={() => setPicker(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); setFeedRefreshKey((k) => k + 1) }}
        type={modalType}
      />

      {/* ── Swipe Mode Full-Screen Overlay ── */}
      {swipeMode && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: '#101837' }}
        >
          {/* Swipe header */}
          <div className="h-14 flex items-center justify-between px-5 shrink-0">
            <button
              type="button"
              className="text-white/60 hover:text-white p-1 text-xl"
              onClick={() => setSwipeMode(false)}
            >
              ×
            </button>
            <p className="text-sm font-semibold text-white">匹配模式</p>
            <div className="w-8" />
          </div>

          {/* Swipe hint */}
          <div className="flex justify-center gap-8 py-2 text-xs text-white/30 shrink-0">
            <span>← 跳过</span>
            <span>右滑连接 →</span>
          </div>

          {/* Card stack */}
          <div className="flex-1 px-6 pb-6 relative">
            {swipeLoading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-white/50 text-sm">加载创造者…</p>
              </div>
            ) : swipeProfiles.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
                <p className="text-4xl">🪐</p>
                <p className="text-white font-semibold">暂时没有更多了</p>
                <p className="text-white/40 text-sm">先去看看 Explore 列表，或者等新创造者加入</p>
                <button
                  type="button"
                  className="mt-2 text-sm text-[#e46d2e] border border-[#e46d2e]/30 rounded-full px-5 py-2"
                  onClick={() => setSwipeMode(false)}
                >
                  返回列表
                </button>
              </div>
            ) : (
              <SwipeStack
                profiles={swipeProfiles}
                onSwipe={handleSwipe}
                onEmpty={() => setSwipeProfiles([])}
              />
            )}
          </div>

          {/* Action buttons */}
          {!swipeLoading && swipeProfiles.length > 0 && (
            <div className="flex justify-center gap-8 pb-8 shrink-0">
              <button
                type="button"
                className="h-16 w-16 rounded-full border-2 border-red-400/60 bg-red-400/10 flex items-center justify-center text-2xl hover:bg-red-400/20 transition-colors"
                aria-label="Skip"
              >
                ✕
              </button>
              <button
                type="button"
                className="h-16 w-16 rounded-full border-2 border-green-400/60 bg-green-400/10 flex items-center justify-center text-2xl hover:bg-green-400/20 transition-colors"
                aria-label="Connect"
              >
                ♥
              </button>
            </div>
          )}
        </div>
      )}

      {/* Swipe Confirm Modal */}
      {pendingSwipe && (
        <SwipeConfirmModal
          profile={pendingSwipe.profile}
          iceBreakerText={pendingSwipe.iceBreaker}
          onConfirm={handleConfirmSwipe}
          onCancel={() => setPendingSwipe(null)}
          sending={swipeSending}
        />
      )}
    </div>
  )
}
