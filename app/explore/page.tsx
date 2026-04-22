'use client'

import { useEffect, useMemo, useState, Suspense, useCallback, useRef } from 'react'
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

export default function ExplorePage() {
  const { user, sessionUser, loading, profileLoading } = useAuth()
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
  const [picker, setPicker] = useState<null | 'skill' | 'role' | 'location'>(null)
  const [demoXp, setDemoXp] = useState(SWIPE_DEMO_INITIAL_XP)

  const SKILL_OPTIONS = useMemo(() => SKILLS, [])
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

  useEffect(() => {
    return subscribeEntityCreated(() => setFeedRefreshKey((k) => k + 1))
  }, [subscribeEntityCreated])

  const handleSwipe = useCallback(
    async (profile: UserProfile, dir: SwipeDirection) => {
      // 左滑只是 pass，不写已发列表，下次进入时仍可出现
      if (dir !== 'right' || !sessionUser) return

      showSwipeNotice('右滑已触发：正在生成消息…')

      let ice = ''
      try {
        ice = await generateIceBreakerAI({
          senderName: user?.name ?? sessionUser.email?.split('@')[0] ?? '我',
          senderRole: user?.role ?? null,
          senderTrack: user?.hackathon_track ?? null,
          senderSkills: (user?.skills ?? []) as string[],
          senderManifesto: user?.manifesto ?? null,
          receiverName: profile.name ?? '你',
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
        showSwipeNotice('已发送连接请求')
      } catch (e) {
        const err = e instanceof Error ? e.message : ''
        if (err === 'UNAUTHENTICATED') showSwipeNotice('未登录，无法发送请求')
        else if (err === 'RLS_DENIED') showSwipeNotice('权限不足（RLS），请刷新重试')
        else if (err === 'SENDER_MISMATCH') showSwipeNotice('登录状态异常，请刷新重试')
        else if (err === 'ALREADY_SENT') showSwipeNotice('你已向对方发送过待处理请求')
        else if (err === 'ALREADY_CONNECTED') showSwipeNotice('你们已连接')
        else showSwipeNotice('发送失败，请稍后再试')
      }
    },
    [sessionUser, showSwipeNotice, user],
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
            {/* 左：Messages 入口，样式与右侧 View Toggle 单按钮一致 */}
            <Link
              href="/messages"
              className="relative flex shrink-0 items-center justify-center rounded-[8px] bg-white/[0.08] p-[4px] text-white transition-colors hover:bg-white/[0.14]"
              aria-label="消息"
            >
              <IconSatelliteDish className="h-4.5 w-4.5 text-white/50" />
              {inboxBadgeTotal > 0 ? (
                <span className="absolute -right-[2px] -top-[2px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#e46d2e] px-[3px] text-[9px] font-bold leading-none text-white shadow-[0_1px_4px_rgba(228,109,46,0.6)]">
                  {inboxBadgeTotal > 99 ? '99+' : inboxBadgeTotal}
                </span>
              ) : null}
            </Link>

            {/* 中：搜索框 */}
            <div className="flex h-[32px] min-w-0 flex-1 items-center gap-2 rounded-[20px] bg-white/[0.08] px-[14px] py-[8px]">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-[2px] bg-[#6b7280]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators..."
                className="min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-[#6b7280] focus:outline-none"
                aria-label="Search creators"
              />
            </div>

            {/* 右：View Toggle（Figma node 135-157，250:155） */}
            <div className="flex shrink-0 items-center gap-[2px] overflow-hidden rounded-[8px] bg-white/[0.08]">
              <button
                type="button"
                className={`flex items-center justify-center rounded-[8px] p-[4px] transition-colors ${
                  !swipeMode ? 'bg-white/[0.15]' : ''
                }`}
                aria-label="列表视图"
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
                aria-label="滑动视图"
                aria-pressed={swipeMode}
                onClick={handleEnterSwipe}
              >
                <IconSwipeStack active={swipeMode} className="h-6 w-6" />
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
              className={`shrink-0 rounded-[14px] px-3 py-[5px] text-[12px] ${
                sameTrackOnly
                  ? 'border border-[#e46d2e]/40 bg-[#e46d2e]/15 text-[#e46d2e]'
                  : 'bg-white/10 text-[#6b7280]'
              }`}
              onClick={() => setSameTrackOnly((v) => !v)}
              disabled={!user?.hackathon_track}
              title={user?.hackathon_track ? '仅显示同赛道创作者' : '你还没有设置赛道（在 Onboarding 里可选）'}
            >
              同赛道{sameTrackOnly ? ' ✓' : ''}
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
      </div>

      <BottomTabs />

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
