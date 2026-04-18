'use client'

import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { CreateModal } from '@/components/features/create'
import { Button } from '@/components/ui/button'
import { CreatorsFeed } from '@/components/features/explore/CreatorsFeed'
import type { SwipeDirection } from '@/components/features/swipe/SwipeStack'
import { SwipeDemoExperience } from '@/components/features/swipe/SwipeDemoExperience'
import { ProfileRepository } from '@/supabase/repos/profile'
import { CollabRepository } from '@/supabase/repos/collab'
import { SWIPE_DEMO_INITIAL_XP, getSwipeXpBarDisplay } from '@/lib/swipe-demo-xp'
import { appendSwipeSkippedId, readSwipeSkippedIds } from '@/lib/swipe-skipped-ids'
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
  const [swipeNotice, setSwipeNotice] = useState<string | null>(null)
  const swipeNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'best' | 'new'>('best')
  const [skill, setSkill] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [picker, setPicker] = useState<null | 'skill' | 'role' | 'location'>(null)
  const [demoXp, setDemoXp] = useState(SWIPE_DEMO_INITIAL_XP)

  const SKILL_OPTIONS = useMemo(
    () => ['UI Design', 'Figma', 'Full-Stack', 'AI / ML', 'Backend', 'Research', 'Go-to-Market', 'Brand Identity'],
    [],
  )
  const ROLE_OPTIONS = useMemo(() => ['Visionary', 'Builder', 'Strategist', 'Connector'], [])
  const LOCATION_OPTIONS = useMemo(() => ['NYC', 'SF', 'London', 'Beijing', 'Shanghai', 'Shenzhen'], [])

  const xpBar = useMemo(() => getSwipeXpBarDisplay(demoXp.xp), [demoXp.xp])

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  // Load swipe profiles（排除当前用户已对其右滑发过请求的 id，存储键按用户隔离）
  const loadSwipeProfiles = useCallback(async () => {
    if (!sessionUser) return
    setSwipeLoading(true)
    try {
      const skipped = readSwipeSkippedIds(sessionUser.id)
      const repo = new ProfileRepository()
      const all = await repo.listCreators(30)
      const filtered = all.filter(
        (p) => p.id !== sessionUser.id && !skipped.includes(p.id),
      )
      setSwipeProfiles(filtered.slice(0, 10))
    } catch (e) {
      console.error('loadSwipeProfiles failed', e)
    } finally {
      setSwipeLoading(false)
    }
  }, [sessionUser])

  const handleEnterSwipe = useCallback(() => {
    loadSwipeProfiles()
    setSwipeMode(true)
  }, [loadSwipeProfiles])

  const showSwipeNotice = useCallback((text: string) => {
    if (swipeNoticeTimerRef.current) clearTimeout(swipeNoticeTimerRef.current)
    setSwipeNotice(text)
    swipeNoticeTimerRef.current = setTimeout(() => {
      setSwipeNotice(null)
      swipeNoticeTimerRef.current = null
    }, 4000)
  }, [])

  useEffect(() => {
    return () => {
      if (swipeNoticeTimerRef.current) clearTimeout(swipeNoticeTimerRef.current)
    }
  }, [])

  const handleSwipe = useCallback(
    async (profile: UserProfile, dir: SwipeDirection) => {
      // 左滑只是 pass，不写已发列表，下次进入时仍可出现
      if (dir !== 'right' || !sessionUser) return

      const defaultMessage = `Hi ${profile.name ?? 'there'}, your profile really caught my eye! I'd love to connect and explore if we could collaborate.`

      try {
        await new CollabRepository().sendRequest({
          senderId: sessionUser.id,
          receiverId: profile.id,
          type: 'just_connect',
          message: defaultMessage,
          iceBreakerText: defaultMessage,
        })
        appendSwipeSkippedId(sessionUser.id, profile.id)
        showSwipeNotice('已发送连接请求')
      } catch (e) {
        const err = e instanceof Error ? e.message : ''
        if (err === 'ALREADY_SENT') {
          showSwipeNotice('你已向对方发送过待处理请求')
        } else {
          showSwipeNotice('发送失败，请稍后再试')
        }
      }
    },
    [sessionUser, showSwipeNotice],
  )

  const handleSwipeEmpty = useCallback(() => {
    // 卡牌耗尽时什么都不做；handleRestart 里会调 loadSwipeProfiles 重拉
  }, [])

  const handleCloseSwipe = useCallback(() => {
    setSwipeMode(false)
  }, [])

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

        {/* XP Bar — 与全屏 Swipe 共用 demoXp 曲线 */}
        <div className="bg-[#101837] px-4">
          <div className="h-px bg-white/10" />
          <div className="flex items-center gap-[10px] py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-[3px] shrink-0">
              {([1, 2, 3, 4] as const).map((lvl) => (
                <span
                  key={lvl}
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: xpBar.dotBg(lvl) }}
                />
              ))}
            </div>
            <span
              className="text-[11px] font-medium shrink-0 whitespace-nowrap"
              style={{ color: xpBar.levelColor }}
            >
              {xpBar.label}
            </span>
            <div className="flex-1 min-w-0 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${xpBar.fillPct}%`,
                  backgroundColor: xpBar.levelColor,
                  boxShadow: `0px 0px 6px ${xpBar.levelColor}80`,
                }}
              />
            </div>
            <span className="text-[10px] text-white/45 shrink-0 whitespace-nowrap">{xpBar.countLabel}</span>
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
            <CreatorsFeed key={feedRefreshKey} query={query} role={role} skill={skill} location={location} sort={sort} />
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

      {/* ── Swipe Mode Full-Screen Overlay (Demo-aligned) ── */}
      {swipeMode && (
        <div className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-[#101837]">
          <SwipeDemoExperience
            viewer={user as unknown as UserProfile | null}
            profiles={swipeProfiles}
            loading={swipeLoading}
            onClose={handleCloseSwipe}
            onSwipe={handleSwipe}
            onEmpty={handleSwipeEmpty}
            onReload={loadSwipeProfiles}
            demoXp={demoXp}
            onDemoXpChange={setDemoXp}
          />
          {swipeNotice ? (
            <div
              className="pointer-events-none fixed bottom-24 left-1/2 z-[60] max-w-[min(90vw,360px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#121B3E]/95 px-4 py-3 text-center text-sm text-white shadow-lg backdrop-blur-sm"
              role="status"
            >
              {swipeNotice}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
