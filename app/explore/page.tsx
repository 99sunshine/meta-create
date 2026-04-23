'use client'

import { useEffect, useMemo, useState, Suspense, useCallback, useRef, type UIEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { Button } from '@/components/ui/button'
import { useCreateFlow } from '@/components/providers/CreateFlowProvider'
import { CreatorsFeed } from '@/components/features/explore/CreatorsFeed'
import type { SwipeDirection } from '@/components/features/swipe/SwipeStack'
import { SwipeDemoExperience } from '@/components/features/swipe/SwipeDemoExperience'
import { ProfileRepository } from '@/supabase/repos/profile'
import { CollabRepository } from '@/supabase/repos/collab'
import { SWIPE_DEMO_INITIAL_XP, getSwipeXpBarDisplay } from '@/lib/swipe-demo-xp'
import { appendSwipeSkippedId, readSwipeSkippedIds } from '@/lib/swipe-skipped-ids'
import type { UserProfile } from '@/types'
import { useMessagesInbox } from '@/components/providers/MessagesInboxProvider'
import { SKILLS } from '@/constants/skills'
import { generateIceBreakerAI } from '@/lib/icebreaker'
import {
  IconSatelliteDish,
  IconListBullet,
  IconSwipeStack,
} from '@/components/features/explore/ExploreTopBarIcons'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export default function ExplorePage() {
  const { user, sessionUser, loading, profileLoading } = useAuth()
  const { tr } = useLocale()
  const router = useRouter()
  const [feedRefreshKey, setFeedRefreshKey] = useState(0)
  const { subscribeEntityCreated } = useCreateFlow()
  const { inboxBadgeTotal, refreshUnread } = useMessagesInbox()
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
  const [sameTrackOnly, setSameTrackOnly] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [demoXp, setDemoXp] = useState(SWIPE_DEMO_INITIAL_XP)
  const listScrollRef = useRef<HTMLElement | null>(null)
  const collapsibleRef = useRef<HTMLDivElement | null>(null)
  const lastScrollTopRef = useRef(0)
  const [collapseOffset, setCollapseOffset] = useState(0)
  const [collapseMax, setCollapseMax] = useState(0)
  const [hasMeasuredCollapse, setHasMeasuredCollapse] = useState(false)

  const SKILL_OPTIONS = useMemo(() => SKILLS, [])
  const ROLE_OPTIONS = useMemo(() => ['Visionary', 'Builder', 'Strategist', 'Connector'], [])
  const LOCATION_OPTIONS = useMemo(() => ['NYC', 'SF', 'London', 'Beijing', 'Shanghai', 'Shenzhen'], [])
  const activeFilterCount = useMemo(
    () => [skill, role, location].filter(Boolean).length + (sameTrackOnly ? 1 : 0) + (sort !== 'best' ? 1 : 0),
    [location, role, sameTrackOnly, skill, sort],
  )

  const xpBar = useMemo(
    () =>
      getSwipeXpBarDisplay(demoXp.xp, {
        levelName: (level, fallbackName) => tr(`swipe.levelName${level}`) || fallbackName,
        levelLabel: (level, name) => tr('swipe.levelLabel', { level, name }),
        countLabel: (xp, max) => tr('swipe.xpCountLabel', { xp, max }),
      }),
    [demoXp.xp, tr],
  )

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

  useEffect(() => {
    if (!isFilterSheetOpen) return
    const prevOverflow = document.body.style.overflow
    const prevOverscrollBehavior = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.overscrollBehavior = prevOverscrollBehavior
    }
  }, [isFilterSheetOpen])

  useEffect(() => {
    return subscribeEntityCreated(() => setFeedRefreshKey((k) => k + 1))
  }, [subscribeEntityCreated])

  const handleSwipe = useCallback(
    async (profile: UserProfile, dir: SwipeDirection) => {
      // 左滑只是 pass，不写已发列表，下次进入时仍可出现
      if (dir !== 'right' || !sessionUser) return

      showSwipeNotice(tr('explore.swipeTriggered'))

      let ice = ''
      try {
        ice = await generateIceBreakerAI({
          senderName: user?.name ?? sessionUser.email?.split('@')[0] ?? tr('creatorCard.you'),
          senderRole: user?.role ?? null,
          senderTrack: user?.hackathon_track ?? null,
          senderSkills: (user?.skills ?? []) as string[],
          senderManifesto: user?.manifesto ?? null,
          receiverName: profile.name ?? tr('creatorCard.you'),
          receiverRole: profile.role ?? null,
          receiverTrack: (profile as any).hackathon_track ?? null,
          receiverSkills: (profile.skills ?? []) as string[],
          receiverManifesto: profile.manifesto ?? null,
          type: 'just_connect',
        })
      } catch {
        ice = `你好 ${profile.name ?? ''}，看到你的资料很有共鸣，想先连接一下，方便聊聊吗？`
      }

      try {
        await new CollabRepository().sendRequest({
          senderId: sessionUser.id,
          receiverId: profile.id,
          type: 'just_connect',
          message: ice,
          iceBreakerText: ice,
        })
        appendSwipeSkippedId(sessionUser.id, profile.id)
        showSwipeNotice(tr('explore.requestSent'))
      } catch (e) {
        const err = e instanceof Error ? e.message : ''
        if (err === 'UNAUTHENTICATED') showSwipeNotice(tr('explore.notLoggedIn'))
        else if (err === 'RLS_DENIED') showSwipeNotice(tr('explore.permissionDenied'))
        else if (err === 'SENDER_MISMATCH') showSwipeNotice(tr('explore.authMismatch'))
        else if (err === 'ALREADY_SENT') showSwipeNotice(tr('explore.alreadySent'))
        else if (err === 'ALREADY_CONNECTED') showSwipeNotice(tr('explore.alreadyConnected'))
        else showSwipeNotice(tr('explore.sendFailed'))
      }
    },
    [sessionUser, showSwipeNotice, user],
  )

  const handleSwipeEmpty = useCallback(() => {
    // 卡牌耗尽时什么都不做；handleRestart 里会调 loadSwipeProfiles 重拉
  }, [])

  const handleListScroll = useCallback((event: UIEvent<HTMLElement>) => {
    if (collapseMax <= 0) return

    const currentScrollTop = event.currentTarget.scrollTop
    const delta = currentScrollTop - lastScrollTopRef.current
    lastScrollTopRef.current = currentScrollTop

    if (delta === 0) return

    setCollapseOffset((previous) => {
      const next = previous + delta
      if (next < 0) return 0
      if (next > collapseMax) return collapseMax
      return next
    })
  }, [collapseMax])

  useEffect(() => {
    if (swipeMode) {
      setCollapseOffset(0)
      setCollapseMax(0)
      setHasMeasuredCollapse(false)
      lastScrollTopRef.current = 0
      return
    }

    const listElement = listScrollRef.current
    const collapsibleElement = collapsibleRef.current
    if (!listElement || !collapsibleElement) return

    const updateCollapseMax = () => {
      const height = collapsibleElement.scrollHeight
      if (height <= 0) return
      setCollapseMax(height)
      setHasMeasuredCollapse(true)
      setCollapseOffset((previous) => (previous > height ? height : previous))
    }

    updateCollapseMax()
    lastScrollTopRef.current = listElement.scrollTop

    const observer = new ResizeObserver(() => updateCollapseMax())
    observer.observe(collapsibleElement)
    window.addEventListener('resize', updateCollapseMax)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateCollapseMax)
    }
  }, [swipeMode, user?.onboarding_complete])

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
        <p className="text-white/60 relative z-10 text-sm">{tr('common.loading')}</p>
      </div>
    )
  }

  if (!sessionUser) return null

  return (
    <div
      className="relative h-[100dvh] overflow-hidden"
      style={{ backgroundColor: '#101837' }}
    >
      {!swipeMode ? (
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
          <div className="shrink-0">
            {/* Top Bar (Figma: Search + View Toggle) */}
            <div className="z-40 h-[60px] bg-[#101837] px-4 py-[14px]">
              <div className="flex items-center gap-[10px]">
                <Link
                  href="/messages"
                  className="relative flex shrink-0 items-center justify-center rounded-[8px] bg-white/[0.08] p-[4px] text-white transition-colors hover:bg-white/[0.14]"
                  aria-label={tr('nav.messages')}
                >
                  <IconSatelliteDish className="h-4.5 w-4.5 text-white/50" />
                  {inboxBadgeTotal > 0 ? (
                    <span className="absolute -right-[2px] -top-[2px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#e46d2e] px-[3px] text-[9px] font-bold leading-none text-white shadow-[0_1px_4px_rgba(228,109,46,0.6)]">
                      {inboxBadgeTotal > 99 ? '99+' : inboxBadgeTotal}
                    </span>
                  ) : null}
                </Link>

                <div className="flex h-[32px] min-w-0 flex-[1_1_auto] max-w-[calc(100%-176px)] items-center gap-2 rounded-[20px] bg-white/[0.08] px-[14px] py-[8px]">
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-[2px] bg-[#6b7280]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tr('explore.searchPlaceholder')}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-[#6b7280] focus:outline-none"
                    aria-label={tr('explore.searchAria')}
                  />
                </div>

                <div className="shrink-0">
                  <LanguageSwitcher />
                </div>

                <div className="flex shrink-0 items-center gap-[2px] overflow-hidden rounded-[8px] bg-white/[0.08]">
                  <button
                    type="button"
                    className={`flex items-center justify-center rounded-[8px] p-[4px] transition-colors ${
                      !swipeMode ? 'bg-white/[0.15]' : ''
                    }`}
                    aria-label={tr('nav.listView')}
                    aria-pressed={!swipeMode}
                    onClick={() => setSwipeMode(false)}
                  >
                    <IconListBullet active={!swipeMode} className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center rounded-[13px] p-[4px] transition-colors ${
                      swipeMode ? 'bg-white/[0.15]' : ''
                    }`}
                    aria-label={tr('nav.swipeView')}
                    aria-pressed={swipeMode}
                    onClick={handleEnterSwipe}
                  >
                    <IconSwipeStack active={swipeMode} className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#101837] px-4">
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-[10px] border-b border-white/[0.06] py-2">
                <div className="flex shrink-0 items-center gap-[3px]">
                  {([1, 2, 3, 4] as const).map((lvl) => (
                    <span
                      key={lvl}
                      className="h-[5px] w-[5px] rounded-full"
                      style={{ background: xpBar.dotBg(lvl) }}
                    />
                  ))}
                </div>
                <span
                  className="shrink-0 whitespace-nowrap text-[11px] font-medium"
                  style={{ color: xpBar.levelColor }}
                >
                  {xpBar.label}
                </span>
                <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${xpBar.fillPct}%`,
                      backgroundColor: xpBar.levelColor,
                      boxShadow: `0px 0px 6px ${xpBar.levelColor}80`,
                    }}
                  />
                </div>
                <span className="shrink-0 whitespace-nowrap text-[10px] text-white/45">{xpBar.countLabel}</span>
              </div>
            </div>

            <div
              className="overflow-hidden bg-[#101837]"
              style={{
                height: hasMeasuredCollapse ? `${Math.max(0, collapseMax - collapseOffset)}px` : 'auto',
              }}
            >
              <div
                ref={collapsibleRef}
                style={{
                  transform: `translateY(-${collapseOffset}px)`,
                  willChange: 'transform',
                }}
              >
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`shrink-0 rounded-[14px] px-3 py-[5px] text-[12px] ${
                        sort === 'best'
                          ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 font-medium text-[#e46d2e]'
                          : 'bg-white/10 text-[#6b7280]'
                      }`}
                      onClick={() => setSort('best')}
                    >
                      {tr('explore.bestMatch')}
                    </button>
                    <button
                      type="button"
                      className={`shrink-0 rounded-[14px] px-3 py-[5px] text-[12px] ${
                        sort === 'new'
                          ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 font-medium text-[#e46d2e]'
                          : 'bg-white/10 text-[#6b7280]'
                      }`}
                      onClick={() => setSort('new')}
                    >
                      {tr('explore.latest')}
                    </button>
                    <button
                      type="button"
                      className={`shrink-0 rounded-[14px] px-3 py-[5px] text-[12px] ${
                        activeFilterCount > 0
                          ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                          : 'bg-white/10 text-[#6b7280]'
                      }`}
                      onClick={() => setIsFilterSheetOpen(true)}
                    >
                      {tr('explore.filter')}
                      {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                    </button>
                  </div>
                </div>

                {user && !user.onboarding_complete && (
                  <div className="mt-3 border-y border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center">
                    <span className="text-sm text-amber-300">
                      {tr('onboarding.completeProfileBanner')}{' '}
                      <button
                        onClick={() => router.push('/onboarding')}
                        className="font-medium text-amber-200 underline hover:text-white"
                      >
                        {tr('onboarding.completeNow')}
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <main
            ref={listScrollRef}
            onScroll={handleListScroll}
            className="mx-auto w-full min-h-0 max-w-2xl flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-28 sm:px-6"
          >
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
              <CreatorsFeed
                key={feedRefreshKey}
                query={query}
                role={role}
                skill={skill}
                location={location}
                sort={sort}
                sameTrackOnly={sameTrackOnly}
              />
            </Suspense>
          </main>

          {isFilterSheetOpen && (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setIsFilterSheetOpen(false)
              }}
            >
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121B3E] px-4 pt-5 pb-4 max-h-[calc(100dvh-8px)] overflow-y-auto overscroll-contain scrollbar-hide">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">{tr('explore.filters')}</p>
                  <button
                    type="button"
                    className="text-xs text-white/50 underline"
                    onClick={() => {
                      setSkill('')
                      setRole('')
                      setLocation('')
                      setSameTrackOnly(false)
                      setSort('best')
                    }}
                  >
                    {tr('explore.clearAll')}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs text-white/50">{tr('explore.sortBy')}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`rounded-[14px] px-3 py-2 text-xs ${
                          sort === 'best'
                            ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                            : 'bg-white/10 text-white/80 hover:bg-white/15'
                        }`}
                        onClick={() => setSort('best')}
                      >
                        {tr('explore.bestMatch')}
                      </button>
                      <button
                        type="button"
                        className={`rounded-[14px] px-3 py-2 text-xs ${
                          sort === 'new'
                            ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                            : 'bg-white/10 text-white/80 hover:bg-white/15'
                        }`}
                        onClick={() => setSort('new')}
                      >
                        {tr('explore.latest')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-white/50">{tr('onboarding.sameTrack')}</p>
                    <button
                      type="button"
                      className={`rounded-[14px] px-3 py-2 text-xs ${
                        sameTrackOnly
                          ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                      title={user?.hackathon_track ? tr('explore.sameTrackOnlyTitleOn') : tr('explore.sameTrackOnlyTitleOff')}
                      disabled={!user?.hackathon_track}
                      onClick={() => {
                        setSameTrackOnly((v) => !v)
                      }}
                    >
                      {tr('onboarding.sameTrack')}
                      {sameTrackOnly ? ' ✓' : ''}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/50">{tr('explore.skill')}</p>
                      {skill ? (
                        <button
                          type="button"
                          className="text-[11px] text-white/50 underline"
                          onClick={() => setSkill('')}
                        >
                          {tr('common.clear')}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`rounded-[14px] px-3 py-2 text-xs ${
                            skill === opt
                              ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                          onClick={() => setSkill(skill === opt ? '' : opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/50">{tr('explore.role')}</p>
                      {role ? (
                        <button
                          type="button"
                          className="text-[11px] text-white/50 underline"
                          onClick={() => setRole('')}
                        >
                          {tr('common.clear')}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`rounded-[14px] px-3 py-2 text-xs ${
                            role === opt
                              ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                          onClick={() => setRole(role === opt ? '' : opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/50">{tr('explore.location')}</p>
                      {location ? (
                        <button
                          type="button"
                          className="text-[11px] text-white/50 underline"
                          onClick={() => setLocation('')}
                        >
                          {tr('common.clear')}
                        </button>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LOCATION_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`rounded-[14px] px-3 py-2 text-xs ${
                            location === opt
                              ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                          onClick={() => setLocation(location === opt ? '' : opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-white/70 hover:text-white"
                    onClick={() => setIsFilterSheetOpen(false)}
                  >
                    {tr('explore.apply')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 h-[calc(100dvh-84px)] overflow-hidden">
          <SwipeDemoExperience
            viewer={user as unknown as UserProfile | null}
            profiles={swipeProfiles}
            loading={swipeLoading}
            onSwitchToList={() => setSwipeMode(false)}
            onSwitchToSwipe={() => setSwipeMode(true)}
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

      <BottomTabs />
    </div>
  )
}
