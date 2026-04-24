'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { UserProfile } from '@/types'
import { scoreUserMatch } from '@/lib/matching'
import {
  SWIPE_DEMO_INITIAL_XP,
  SWIPE_DEMO_LEVEL_CONFIG,
  swipeDemoLevelFromXp,
} from '@/lib/swipe-demo-xp'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import {
  IconListBullet,
  IconSatelliteDish,
  IconSwipeStack,
} from '@/components/features/explore/ExploreTopBarIcons'

// Ported visual + motion model from docs/mc-swipe-demo/*

const SKILL_COLORS = {
  engineer: { bg: 'rgba(15,134,136,0.15)', text: '#70b7b8', border: 'rgba(15,134,136,0.3)' },
  design: { bg: 'rgba(115,27,209,0.15)', text: '#b98de8', border: 'rgba(115,27,209,0.3)' },
  strategy: { bg: 'rgba(223,112,21,0.15)', text: '#efb88a', border: 'rgba(223,112,21,0.3)' },
  research: { bg: 'rgba(21,55,223,0.15)', text: '#8a9bef', border: 'rgba(21,55,223,0.3)' },
} as const

type SkillCat = keyof typeof SKILL_COLORS

type Planet = {
  bg: string
  glow: string
  ring?: string
  ringTilt?: string
}

type Star = {
  x: number
  y: number
  r: number
  baseR: number
  alpha: number
  speed: number
  phase: number
  glow: boolean
}

type Particle = {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
}

type Meteor = {
  x: number
  y: number
  vx: number
  vy: number
  tailLength: number
  life: number
  maxLife: number
}

function skillToCat(s: string): SkillCat {
  const x = s.toLowerCase()
  if (/(figma|ui|ux|design|prototype|motion)/.test(x)) return 'design'
  if (/(market|growth|strategy|biz|sales|pitch|community)/.test(x)) return 'strategy'
  if (/(research|science|data|analysis|quant|nlp|cv|ml)/.test(x)) return 'research'
  return 'engineer'
}

function astronautSVG(visorColor: string, variant: 'antenna' | 'star' | 'stripe' | 'badge') {
  const accents: Record<string, string> = {
    antenna:
      '<line x1="20" y1="4" x2="20" y2="0" stroke="white" stroke-width="1.5"/><circle cx="20" cy="0" r="2" fill="' +
      visorColor +
      '"/>',
    star:
      '<polygon points="20,6 21,9 24,9 22,11 23,14 20,12 17,14 18,11 16,9 19,9" fill="' +
      visorColor +
      '" opacity="0.6" transform="scale(0.5) translate(32,2)"/>',
    stripe: '',
    badge:
      '<circle cx="32" cy="8" r="3.5" fill="' +
      visorColor +
      '" opacity="0.5"/><text x="32" y="10" text-anchor="middle" fill="white" font-size="5" font-weight="bold">M</text>',
  }
  const accent = accents[variant] || ''
  return `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${accent}
    <ellipse cx="20" cy="22" rx="16" ry="16" fill="#d8d8d8"/>
    <ellipse cx="20" cy="22" rx="13" ry="13" fill="#2a2a3a"/>
    <ellipse cx="20" cy="21" rx="10.5" ry="9.5" fill="url(#v-${variant})"/>
    <defs><linearGradient id="v-${variant}" x1="10" y1="13" x2="30" y2="30">
      <stop offset="0%" stop-color="${visorColor}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#101837" stop-opacity="0.9"/>
    </linearGradient></defs>
    <ellipse cx="16" cy="17" rx="3.5" ry="2.5" fill="white" opacity="0.15" transform="rotate(-15 16 17)"/>
  </svg>`
}

function roleToVisor(role?: string | null) {
  switch ((role ?? '').toLowerCase()) {
    case 'builder':
      return { color: '#0f8688', variant: 'antenna' as const }
    case 'visionary':
      return { color: '#df7015', variant: 'star' as const }
    case 'strategist':
      return { color: '#731bd1', variant: 'badge' as const }
    default:
      return { color: '#0f8688', variant: 'stripe' as const }
  }
}

type SwipeDir = 'left' | 'right'

export function SwipeDemoExperience({
  viewer,
  profiles,
  loading,
  onSwitchToList,
  onSwitchToSwipe,
  onSwipe,
  onEmpty,
  onReload,
  demoXp,
  onDemoXpChange,
  inboxBadgeTotal = 0,
}: {
  viewer: UserProfile | null
  profiles: UserProfile[]
  loading: boolean
  onSwitchToList: () => void
  onSwitchToSwipe: () => void
  onSwipe: (profile: UserProfile, dir: SwipeDir) => void
  onEmpty: () => void
  onReload: () => void
  demoXp: { xp: number; level: number }
  onDemoXpChange: (next: { xp: number; level: number }) => void
  inboxBadgeTotal?: number
}) {
  const { tr } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardStackRef = useRef<HTMLDivElement>(null)
  const planetTrackRef = useRef<HTMLDivElement>(null)
  const xpDotsRef = useRef<HTMLDivElement>(null)
  const xpLevelRef = useRef<HTMLSpanElement>(null)
  const xpFillRef = useRef<HTMLDivElement>(null)
  const xpCountRef = useRef<HTMLSpanElement>(null)
  const xpGainRef = useRef<HTMLDivElement>(null)
  const levelOverlayRef = useRef<HTMLDivElement>(null)
  const levelTitleRef = useRef<HTMLHeadingElement>(null)
  const levelRingRef = useRef<HTMLDivElement>(null)
  const levelBurstRef = useRef<HTMLDivElement>(null)
  const endStateRef = useRef<HTMLDivElement>(null)
  const actionButtonsRef = useRef<HTMLDivElement>(null)
  const onEmptyRef = useRef(onEmpty)
  const onReloadRef = useRef(onReload)
  const deckEmptyNotifiedRef = useRef(false)

  useEffect(() => {
    onEmptyRef.current = onEmpty
  }, [onEmpty])

  useEffect(() => {
    onReloadRef.current = onReload
  }, [onReload])

  useEffect(() => {
    deckEmptyNotifiedRef.current = false
  }, [profiles])

  const demoXpRef = useRef(demoXp)
  demoXpRef.current = demoXp

  const [xpState, setXpState] = useState(() => ({ xp: demoXp.xp, level: demoXp.level }))
  const [deckHint, setDeckHint] = useState<string | null>(null)
  const deckHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const cardIndexRef = useRef(0)

  useEffect(() => {
    onDemoXpChange(xpState)
  }, [xpState, onDemoXpChange])

  useEffect(() => {
    return () => {
      if (deckHintTimerRef.current) clearTimeout(deckHintTimerRef.current)
    }
  }, [])

  useLayoutEffect(() => {
    cardIndexRef.current = cardIndex
  }, [cardIndex])

  const cards = useMemo(() => {
    const list = profiles.slice(0, 6)
    return list.map((p, idx) => {
      const match = viewer ? scoreUserMatch(viewer, p).score : 0
      const role = p.role ?? ''
      const roleKey = String(role).toLowerCase()
      const roleText = role ? tr(`roles.${roleKey}`) : ''
      const { color, variant } = roleToVisor(role)
      const skills = ((p.skills ?? []) as string[]).slice(0, 3).map((s) => ({ text: s, cat: skillToCat(s) }))
      const lookingFor = ((p.tags ?? []) as string[]).slice(0, 2)
      const bgStyle =
        idx % 2 === 0
          ? 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.25) 0%, transparent 60%), radial-gradient(ellipse at 75% 75%, rgba(15,134,136,0.15) 0%, transparent 50%), #1b2440'
          : 'radial-gradient(ellipse at 65% 25%, rgba(228,109,46,0.2) 0%, transparent 55%), radial-gradient(ellipse at 25% 80%, rgba(223,112,21,0.12) 0%, transparent 45%), #1b2440'
      return {
        profile: p,
        name: p.name ?? tr('common.creator'),
        role: roleText,
        school: p.school ? `${p.school}` : tr('swipe.noValue'),
        location: p.city ?? tr('swipe.noValue'),
        match,
        building: p.manifesto ?? tr('swipe.noValue'),
        skills,
        lookingFor: lookingFor.length ? lookingFor : [tr('roles.collaborator')],
        avatar: astronautSVG(color, variant),
        bgStyle,
      }
    })
  }, [profiles, viewer, tr])

  const renderXPBar = useCallback(
    (next: { xp: number; level: number }) => {
      const xpDotsEl = xpDotsRef.current
      const xpLevelEl = xpLevelRef.current
      const xpFillEl = xpFillRef.current
      const xpCountEl = xpCountRef.current
      if (!xpDotsEl || !xpLevelEl || !xpFillEl || !xpCountEl) return

      const cfg = SWIPE_DEMO_LEVEL_CONFIG[next.level]
      const xpInLevel = next.xp - cfg.xpRequired
      const xpRange = cfg.xpMax - cfg.xpRequired
      const pct = next.level === 4 ? 100 : Math.min(100, (xpInLevel / xpRange) * 100)

      xpDotsEl.innerHTML = [1, 2, 3, 4]
        .map(
          (lvl) =>
            `<div class="dot" style="background:${
              lvl <= next.level ? SWIPE_DEMO_LEVEL_CONFIG[lvl].color : 'rgba(255,255,255,0.15)'
            }"></div>`,
        )
        .join('')

      const levelName = tr(`swipe.levelName${next.level}`)
      xpLevelEl.textContent = tr('swipe.levelLabel', { level: next.level, name: levelName })
      xpLevelEl.style.color = cfg.color
      xpFillEl.style.width = pct + '%'
      xpFillEl.style.background = cfg.color
      xpFillEl.style.boxShadow = `0 0 6px ${cfg.color}80`
      xpCountEl.textContent = tr('swipe.xpCountLabel', { xp: next.xp, max: cfg.xpMax })
    },
    [tr],
  )

  const showLevelUp = useCallback((level: number) => {
    const overlay = levelOverlayRef.current
    const title = levelTitleRef.current
    const ring = levelRingRef.current
    const burst = levelBurstRef.current
    if (!overlay || !title || !ring || !burst) return

    const cfg = SWIPE_DEMO_LEVEL_CONFIG[level]
    title.textContent = tr('swipe.levelLabel', { level, name: tr(`swipe.levelName${level}`) })
    title.style.color = cfg.color
    ring.style.setProperty('--level-color', cfg.color)

    burst.innerHTML = ''
    for (let i = 0; i < 12; i++) {
      const angle = (360 / 12) * i
      const particle = document.createElement('div')
      particle.className = 'burst-particle'
      particle.style.setProperty('--angle', angle + 'deg')
      particle.style.background = cfg.color
      burst.appendChild(particle)
    }

    overlay.classList.add('show')
    requestAnimationFrame(() => {
      ring.classList.add('animate')
      burst.querySelectorAll('.burst-particle').forEach((p, i) => {
        setTimeout(() => p.classList.add('animate'), i * 30)
      })
    })

    setTimeout(() => {
      overlay.classList.remove('show')
      ring.classList.remove('animate')
    }, 2200)
  }, [tr])

  const addXP = useCallback(
    (amount: number) => {
      setXpState((prev) => {
        const oldLevel = prev.level
        const nextXP = prev.xp + amount
        const nextLevel = swipeDemoLevelFromXp(nextXP)
        const next = { xp: nextXP, level: nextLevel }

        const xpGainEl = xpGainRef.current
        if (xpGainEl) {
          xpGainEl.classList.remove('show')
          // force reflow
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          xpGainEl.offsetWidth
          xpGainEl.textContent = `+${amount} XP`
          xpGainEl.style.color = SWIPE_DEMO_LEVEL_CONFIG[nextLevel].color
          xpGainEl.classList.add('show')
        }

        renderXPBar(next)
        if (nextLevel > oldLevel) setTimeout(() => showLevelUp(nextLevel), 600)
        return next
      })
    },
    [renderXPBar, showLevelUp],
  )

  // ---- Planet track ----
  const PLANETS = useMemo<Planet[]>(
    () => [
      {
        bg: `radial-gradient(ellipse at 20% 15%, rgba(253,186,116,0.6) 0%, transparent 42%),
          radial-gradient(ellipse at 75% 25%, rgba(190,90,130,0.4) 0%, transparent 38%),
          radial-gradient(ellipse at 60% 80%, rgba(60,140,135,0.5) 0%, transparent 42%),
          conic-gradient(from 120deg at 50% 50%, #b07850, #9e6878, #5a9490, #c08a58, #b07850)`,
        glow: 'rgba(190,130,80,0.3)',
      },
      {
        bg: `radial-gradient(ellipse at 25% 20%, rgba(200,170,220,0.6) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 30%, rgba(90,110,170,0.5) 0%, transparent 38%),
          radial-gradient(ellipse at 50% 80%, rgba(160,80,100,0.4) 0%, transparent 40%),
          conic-gradient(from 200deg at 45% 55%, #8878a8, #6070a0, #a06878, #9080b0, #8878a8)`,
        glow: 'rgba(140,120,170,0.3)',
        ring: 'rgba(200,170,220,0.6)',
        ringTilt: '-15deg',
      },
      {
        bg: `radial-gradient(ellipse at 30% 18%, rgba(140,200,170,0.6) 0%, transparent 40%),
          radial-gradient(ellipse at 72% 35%, rgba(200,160,80,0.5) 0%, transparent 38%),
          radial-gradient(ellipse at 45% 78%, rgba(120,100,170,0.4) 0%, transparent 40%),
          conic-gradient(from 60deg at 50% 50%, #6a9a80, #c0a060, #7868a0, #78a888, #6a9a80)`,
        glow: 'rgba(106,154,128,0.3)',
      },
      {
        bg: `radial-gradient(ellipse at 22% 25%, rgba(130,160,200,0.6) 0%, transparent 40%),
          radial-gradient(ellipse at 75% 20%, rgba(100,180,190,0.45) 0%, transparent 38%),
          radial-gradient(ellipse at 55% 78%, rgba(200,130,140,0.45) 0%, transparent 40%),
          conic-gradient(from 300deg at 50% 50%, #6080a8, #5898a0, #c08888, #7090b0, #6080a8)`,
        glow: 'rgba(96,128,168,0.3)',
        ring: 'rgba(100,180,190,0.6)',
        ringTilt: '10deg',
      },
      {
        bg: `radial-gradient(ellipse at 28% 22%, rgba(220,190,100,0.6) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 30%, rgba(180,90,70,0.5) 0%, transparent 38%),
          radial-gradient(ellipse at 50% 75%, rgba(80,140,130,0.4) 0%, transparent 40%),
          conic-gradient(from 45deg at 48% 52%, #b8a050, #a86050, #5a8a80, #c0a858, #b8a050)`,
        glow: 'rgba(184,160,80,0.3)',
        ring: 'rgba(220,190,100,0.6)',
        ringTilt: '-8deg',
      },
      {
        bg: `radial-gradient(ellipse at 25% 20%, rgba(200,140,150,0.6) 0%, transparent 40%),
          radial-gradient(ellipse at 72% 28%, rgba(200,150,80,0.5) 0%, transparent 38%),
          radial-gradient(ellipse at 48% 80%, rgba(90,95,130,0.5) 0%, transparent 40%),
          conic-gradient(from 160deg at 50% 50%, #b08088, #c09858, #5a6080, #a87880, #b08088)`,
        glow: 'rgba(176,128,136,0.3)',
      },
      {
        bg: `radial-gradient(ellipse at 28% 22%, rgba(130,200,200,0.55) 0%, transparent 40%),
          radial-gradient(ellipse at 70% 25%, rgba(140,120,180,0.45) 0%, transparent 38%),
          radial-gradient(ellipse at 50% 78%, rgba(150,180,100,0.4) 0%, transparent 40%),
          conic-gradient(from 240deg at 50% 50%, #5a9898, #8070a8, #90a860, #68a0a0, #5a9898)`,
        glow: 'rgba(90,152,152,0.3)',
      },
    ],
    [],
  )

  const activePlanetIdxRef = useRef(0)
  const settleTimeoutRef = useRef<number | null>(null)
  const PLANET_GAP = 22
  const SIZE_ACTIVE = 110
  const SIZE_NEAR = 40
  const SIZE_FAR = 24
  const computeLayout = useCallback(
    (activeIdx: number) => {
      const laneW = containerRef.current?.clientWidth ?? 393
      const LANE_CENTER = laneW / 2
      const sizes = PLANETS.map((_, i) => {
        const dist = Math.abs(i - activeIdx)
        if (dist === 0) return SIZE_ACTIVE
        if (dist === 1) return SIZE_NEAR
        return SIZE_FAR
      })
      const positions = new Array<number>(PLANETS.length)
      positions[activeIdx] = LANE_CENTER - sizes[activeIdx] / 2
      let cursor = positions[activeIdx]
      for (let i = activeIdx - 1; i >= 0; i--) {
        cursor -= sizes[i] + PLANET_GAP
        positions[i] = cursor
      }
      cursor = positions[activeIdx] + sizes[activeIdx] + PLANET_GAP
      for (let i = activeIdx + 1; i < PLANETS.length; i++) {
        positions[i] = cursor
        cursor += sizes[i] + PLANET_GAP
      }
      const opacities = PLANETS.map((_, i) => {
        const dist = Math.abs(i - activeIdx)
        return dist === 0 ? 1 : dist === 1 ? 0.7 : 0.4
      })
      return { sizes, positions, opacities }
    },
    [PLANETS, PLANET_GAP, SIZE_ACTIVE, SIZE_NEAR, SIZE_FAR],
  )

  const applyLayout = useCallback(
    (sizes: number[], positions: number[], opacities: number[], animate: boolean) => {
      const track = planetTrackRef.current
      if (!track) return
      const els = track.querySelectorAll<HTMLDivElement>('.planet')
      els.forEach((el, i) => {
        const p = PLANETS[i]
        const size = sizes[i]
        const glowSize = size > 60 ? 20 : size > 35 ? 10 : 6
        if (!animate) el.style.transition = 'none'
        el.style.width = size + 'px'
        el.style.height = size + 'px'
        el.style.left = positions[i] + 'px'
        el.style.transform = 'translateY(-50%)'
        el.style.opacity = String(opacities[i])
        el.style.background = p.bg
        el.style.boxShadow = `inset -${Math.round(size * 0.08)}px -${Math.round(size * 0.06)}px ${Math.round(
          size * 0.15,
        )}px rgba(0,0,0,0.45), 0 0 ${glowSize}px ${p.glow}`
        if (!animate) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          el.offsetWidth
          el.style.transition = ''
        }
      })
    },
    [PLANETS],
  )

  const layoutPlanets = useCallback(
    (animate: boolean) => {
      const { sizes, positions, opacities } = computeLayout(activePlanetIdxRef.current)
      applyLayout(sizes, positions, opacities, animate)
    },
    [applyLayout, computeLayout],
  )

  const layoutPlanetsDrag = useCallback(
    (progress: number) => {
      const curIdx = activePlanetIdxRef.current
      const nextIdx = Math.min(curIdx + 1, PLANETS.length - 1)
      if (nextIdx === curIdx) {
        const cur = computeLayout(curIdx)
        const shift = Math.min(progress, 1) * -20
        const shifted = cur.positions.map((p) => p + shift)
        applyLayout(cur.sizes, shifted, cur.opacities, false)
        return
      }
      const cur = computeLayout(curIdx)
      const next = computeLayout(nextIdx)
      const t = Math.min(progress, 1)
      const sizes = PLANETS.map((_, i) => cur.sizes[i] + (next.sizes[i] - cur.sizes[i]) * t)
      const positions = PLANETS.map((_, i) => cur.positions[i] + (next.positions[i] - cur.positions[i]) * t)
      const opacities = PLANETS.map((_, i) => cur.opacities[i] + (next.opacities[i] - cur.opacities[i]) * t)
      applyLayout(sizes, positions, opacities, false)
    },
    [PLANETS, applyLayout, computeLayout],
  )

  const shiftPlanets = useCallback(() => {
    activePlanetIdxRef.current = Math.min(activePlanetIdxRef.current + 1, PLANETS.length - 1)
    layoutPlanets(true)
    if (settleTimeoutRef.current) window.clearTimeout(settleTimeoutRef.current)
    settleTimeoutRef.current = window.setTimeout(() => {
      const track = planetTrackRef.current
      if (!track) return
      const els = track.querySelectorAll<HTMLDivElement>('.planet')
      const activeEl = els[activePlanetIdxRef.current]
      if (!activeEl) return
      const settled = SIZE_ACTIVE - 16
      activeEl.style.transition = 'width 0.3s ease-out, height 0.3s ease-out'
      activeEl.style.width = settled + 'px'
      activeEl.style.height = settled + 'px'
    }, 500)
  }, [PLANETS.length, layoutPlanets])

  const buildPlanets = useCallback(() => {
    const track = planetTrackRef.current
    if (!track) return
    track.innerHTML = ''
    PLANETS.forEach((p, i) => {
      const el = document.createElement('div')
      el.className = 'planet'
      el.dataset.idx = String(i)
      if (p.ring) {
        const ringColor = p.ring
        const tilt = p.ringTilt || '0deg'
        el.style.setProperty('--ring-color', ringColor)
        const back = document.createElement('div')
        back.className = 'ring-back'
        back.style.setProperty('--ring-tilt', tilt)
        back.style.setProperty('--ring-color', ringColor)
        el.appendChild(back)
        const front = document.createElement('div')
        front.className = 'ring-front'
        front.style.setProperty('--ring-tilt', tilt)
        front.style.setProperty('--ring-color', ringColor)
        el.appendChild(front)
      }
      track.appendChild(el)
    })
    layoutPlanets(false)
  }, [PLANETS, layoutPlanets])

  // ---- Starfield + meteors (canvas) ----
  const animRef = useRef<number | null>(null)
  const starsRef = useRef<Star[]>([])
  const particlesRef = useRef<Particle[]>([])
  const meteorsRef = useRef<Meteor[]>([])

  const initStarfield = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = 393 * dpr
    canvas.height = 852 * dpr
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const stars: Star[] = []
    for (let i = 0; i < 140; i++) {
      const isGlow = i < 15
      const r = isGlow ? Math.random() * 1.3 + 1.5 : Math.random() * 1.0 + 0.3
      stars.push({
        x: Math.random() * 393,
        y: Math.random() * 852,
        r,
        baseR: r,
        alpha: isGlow ? Math.random() * 0.3 + 0.5 : Math.random() * 0.4 + 0.25,
        speed: Math.random() * 0.8 + 0.3,
        phase: Math.random() * Math.PI * 2,
        glow: isGlow,
      })
    }
    starsRef.current = stars

    const particles: Particle[] = []
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * 393,
        y: Math.random() * 852,
        r: Math.random() * 0.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.2 + 0.08),
        alpha: Math.random() * 0.12 + 0.06,
      })
    }
    particlesRef.current = particles
    meteorsRef.current = []
  }, [])

  const spawnMeteor = useCallback(() => {
    const angle = ((Math.random() * 30 + 25) * Math.PI) / 180
    const speed = Math.random() * 2 + 3.5
    const startX = Math.random() * 280 + 30
    const startY = 100 + Math.random() * 550
    const tailLength = Math.random() * 80 + 100
    meteorsRef.current.push({
      x: startX,
      y: startY,
      vx: Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
      tailLength,
      life: 0,
      maxLife: Math.random() * 30 + 40,
    })
  }, [])

  const drawMeteors = useCallback((ctx: CanvasRenderingContext2D) => {
    if (Math.random() < 0.03) spawnMeteor()
    const meteors = meteorsRef.current
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i]
      m.x += m.vx
      m.y += m.vy
      m.life++
      const t = m.life / m.maxLife
      const alpha = Math.sin(t * Math.PI) * 0.6
      if (m.life > m.maxLife || m.y > 920 || m.x > 500) {
        meteors.splice(i, 1)
        continue
      }
      const len = Math.sqrt(m.vx * m.vx + m.vy * m.vy)
      const dx = m.vx / len
      const dy = m.vy / len
      const tailX = m.x - dx * m.tailLength
      const tailY = m.y - dy * m.tailLength

      const ambientGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
      ambientGrad.addColorStop(0, `rgba(180,200,255,0)`)
      ambientGrad.addColorStop(0.6, `rgba(180,200,255,${alpha * 0.04})`)
      ambientGrad.addColorStop(1, `rgba(200,215,255,${alpha * 0.08})`)
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(m.x, m.y)
      ctx.strokeStyle = ambientGrad
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.stroke()

      const midGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
      midGrad.addColorStop(0, `rgba(200,215,255,0)`)
      midGrad.addColorStop(0.5, `rgba(200,215,255,${alpha * 0.1})`)
      midGrad.addColorStop(1, `rgba(220,230,255,${alpha * 0.25})`)
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(m.x, m.y)
      ctx.strokeStyle = midGrad
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.stroke()

      const coreGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y)
      coreGrad.addColorStop(0, `rgba(255,255,255,0)`)
      coreGrad.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.15})`)
      coreGrad.addColorStop(1, `rgba(255,255,255,${alpha * 0.7})`)
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(m.x, m.y)
      ctx.strokeStyle = coreGrad
      ctx.lineWidth = 1.2
      ctx.lineCap = 'round'
      ctx.stroke()

      const headGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 10)
      headGlow.addColorStop(0, `rgba(255,255,255,${alpha * 0.4})`)
      headGlow.addColorStop(0.3, `rgba(200,215,255,${alpha * 0.12})`)
      headGlow.addColorStop(1, `rgba(180,200,255,0)`)
      ctx.fillStyle = headGlow
      ctx.beginPath()
      ctx.arc(m.x, m.y, 10, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [spawnMeteor])

  const drawStarfield = useCallback(
    (time: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return
      ctx.globalAlpha = 1
      ctx.clearRect(0, 0, 393, 852)
      ctx.fillStyle = '#101837'
      ctx.fillRect(0, 0, 393, 852)

      for (const s of starsRef.current) {
        const breath = Math.sin(time * 0.001 * s.speed + s.phase)
        const a = s.alpha + breath * 0.35
        const clampedA = Math.max(0.03, Math.min(1, a))
        const r = s.glow ? s.baseR + breath * 0.4 : s.baseR
        if (s.glow) {
          const haloR = r * 4
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR)
          grad.addColorStop(0, `rgba(200,220,255,${clampedA * 0.25})`)
          grad.addColorStop(0.3, `rgba(200,220,255,${clampedA * 0.08})`)
          grad.addColorStop(1, 'rgba(200,220,255,0)')
          ctx.globalAlpha = 1
          ctx.shadowBlur = 0
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = clampedA
        } else {
          ctx.globalAlpha = clampedA
        }
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -5) {
          p.y = 857
          p.x = Math.random() * 393
        }
        if (p.x < -5) p.x = 398
        if (p.x > 398) p.x = -5
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      drawMeteors(ctx)
      ctx.globalAlpha = 1

      animRef.current = requestAnimationFrame(drawStarfield)
    },
    [drawMeteors],
  )

  // ---- Card DOM + pointer physics (ported) ----
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    prevTimestamp: 0,
    prevX: 0,
    velocityX: 0,
    dragCard: null as HTMLDivElement | null,
  })

  const updateCardDepths = useCallback(
    (animate: boolean) => {
      const stack = cardStackRef.current
      if (!stack) return
      const idx = cardIndexRef.current
      const remaining = cards.length - idx
      if (remaining <= 0) {
        endStateRef.current?.classList.add('show')
        if (actionButtonsRef.current) {
          actionButtonsRef.current.style.opacity = '0'
          actionButtonsRef.current.style.pointerEvents = 'none'
        }
        // 初始无候选时不回调（避免父组件 setState + 不稳定 onEmpty 导致无限更新）
        const deckExhausted = cards.length > 0 && idx >= cards.length
        if (deckExhausted && !deckEmptyNotifiedRef.current) {
          deckEmptyNotifiedRef.current = true
          onEmptyRef.current()
        }
        return
      }
      endStateRef.current?.classList.remove('show')
      if (actionButtonsRef.current) {
        actionButtonsRef.current.style.opacity = '1'
        actionButtonsRef.current.style.pointerEvents = 'auto'
      }
      const allCards = stack.querySelectorAll<HTMLDivElement>('.swipe-card:not(.exiting)')
      allCards.forEach((card) => {
        const dataIdx = Number(card.dataset.index ?? '0')
        const depth = dataIdx - idx
        if (depth < 0) {
          card.style.display = 'none'
          return
        }
        card.style.display = ''
        if (!animate) card.style.transition = 'none'
        else
          card.style.transition =
            'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.35s ease, opacity 0.35s ease'
        if (depth > 2) {
          card.style.opacity = '0'
          card.style.pointerEvents = 'none'
          card.style.zIndex = '1'
        } else {
          card.style.transform = `scale(${1 - depth * 0.05}) translateY(${depth * 12}px)`
          card.style.zIndex = String(10 - depth)
          card.style.opacity = '1'
          card.style.filter = depth > 0 ? `brightness(${1 - depth * 0.08})` : ''
          card.style.pointerEvents = depth === 0 ? 'auto' : 'none'
        }
        if (!animate) {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          card.offsetWidth
          card.style.transition = ''
        }
      })
    },
    [cards.length],
  )

  const renderCards = useCallback(() => {
    const stack = cardStackRef.current
    if (!stack) return
    stack.innerHTML = ''
    for (let i = cards.length - 1; i >= 0; i--) {
      const data = cards[i]
      const card = document.createElement('div')
      card.className = 'swipe-card'
      card.dataset.index = String(i)

      const bg = document.createElement('div')
      bg.className = 'card-bg'
      bg.style.background = data.bgStyle
      card.appendChild(bg)

      const matchInd = document.createElement('div')
      matchInd.className = 'swipe-indicator match-indicator'
      matchInd.innerHTML = `<span class="indicator-label">${tr('swipe.match')}</span>`
      card.appendChild(matchInd)

      const skipInd = document.createElement('div')
      skipInd.className = 'swipe-indicator skip-indicator'
      skipInd.innerHTML = `<span class="indicator-label">${tr('swipe.skip')}</span>`
      card.appendChild(skipInd)

      const inner = document.createElement('div')
      inner.className = 'card-inner'

      const header = document.createElement('div')
      header.className = 'card-header'

      const avatarDiv = document.createElement('div')
      avatarDiv.className = 'card-avatar'
      avatarDiv.innerHTML = data.avatar
      header.appendChild(avatarDiv)

      const headerInfo = document.createElement('div')
      headerInfo.className = 'card-header-info'

      const nameEl = document.createElement('div')
      nameEl.className = 'card-name'
      nameEl.textContent = data.name
      headerInfo.appendChild(nameEl)

      const meta = document.createElement('div')
      meta.className = 'card-meta'
      const metaParts = [data.role, data.school, data.location].filter(Boolean)
      meta.innerHTML = metaParts.map((part) => `<span class="card-meta-tag">${part}</span>`).join('')
      headerInfo.appendChild(meta)

      header.appendChild(headerInfo)

      const matchBadge = document.createElement('div')
      matchBadge.className = 'card-match'
      matchBadge.textContent = `${data.match}%`
      header.appendChild(matchBadge)

      inner.appendChild(header)

      const buildLabel = document.createElement('div')
      buildLabel.className = 'card-section-label'
      buildLabel.textContent = tr('swipe.buildingNext')
      inner.appendChild(buildLabel)

      const buildText = document.createElement('div')
      buildText.className = 'card-building'
      buildText.textContent = data.building
      inner.appendChild(buildText)

      const skillLabel = document.createElement('div')
      skillLabel.className = 'card-section-label'
      skillLabel.textContent = tr('swipe.skills')
      inner.appendChild(skillLabel)

      const tags = document.createElement('div')
      tags.className = 'card-tags'
      data.skills.forEach((s: { text: string; cat: SkillCat }) => {
        const tag = document.createElement('span')
        tag.className = 'skill-tag'
        const c = SKILL_COLORS[s.cat]
        tag.style.background = c.bg
        tag.style.color = c.text
        tag.style.border = `1px solid ${c.border}`
        tag.textContent = s.text
        tags.appendChild(tag)
      })
      inner.appendChild(tags)

      const lookLabel = document.createElement('div')
      lookLabel.className = 'card-section-label'
      lookLabel.textContent = tr('swipe.lookingFor')
      inner.appendChild(lookLabel)

      const lookChips = document.createElement('div')
      lookChips.className = 'card-looking'
      data.lookingFor.forEach((l: string) => {
        const chip = document.createElement('span')
        chip.className = 'looking-chip'
        chip.textContent = l
        lookChips.appendChild(chip)
      })
      inner.appendChild(lookChips)

      card.appendChild(inner)
      stack.appendChild(card)
    }
    updateCardDepths(false)
  }, [cards, updateCardDepths, tr])

  const getTopCard = useCallback(() => {
    const stack = cardStackRef.current
    if (!stack) return null
    return stack.querySelector<HTMLDivElement>('.swipe-card:last-child')
  }, [])

  const swipeCard = useCallback(
    (card: HTMLDivElement, direction: SwipeDir) => {
      const isMatch = direction === 'right'
      const exitX = direction === 'right' ? 500 : -500
      const exitRotation = direction === 'right' ? 25 : -25

      card.classList.add('exiting')
      card.style.transform = `translate3d(${exitX}px, ${dragRef.current.currentY || 0}px, 0) rotate(${exitRotation}deg)`
      card.style.opacity = '0'

      shiftPlanets()
      if (isMatch) setTimeout(() => addXP(30), 200)

      const idx = Number(card.dataset.index ?? '0')
      const data = cards[idx]
      if (data?.profile) onSwipe(data.profile, direction)

      let advanced = false
      function advance() {
        if (advanced) return
        advanced = true
        card.remove()
        setCardIndex((x) => x + 1)
      }
      card.addEventListener('transitionend', advance, { once: true })
      setTimeout(advance, 500)
    },
    [addXP, cards, onSwipe, shiftPlanets],
  )

  const onPointerDown = useCallback((e: PointerEvent) => {
    const card = getTopCard()
    if (!card || card.classList.contains('exiting')) return
    dragRef.current.isDragging = true
    dragRef.current.dragCard = card
    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.currentX = 0
    dragRef.current.currentY = 0
    dragRef.current.prevX = e.clientX
    dragRef.current.prevTimestamp = Date.now()
    dragRef.current.velocityX = 0
    card.classList.add('dragging')
  }, [getTopCard])

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const st = dragRef.current
      if (!st.isDragging || !st.dragCard) return
      e.preventDefault()
      st.currentX = e.clientX - st.startX
      st.currentY = e.clientY - st.startY

      const now = Date.now()
      const dt = now - st.prevTimestamp
      if (dt > 0) {
        st.velocityX = (e.clientX - st.prevX) / dt
        st.prevX = e.clientX
        st.prevTimestamp = now
      }

      const rotation = st.currentX * 0.08
      const rotateY = st.currentX * 0.02
      const lift = 1 + Math.min(Math.abs(st.currentX) / 800, 0.03)
      st.dragCard.style.transform = `translate3d(${st.currentX}px, ${st.currentY}px, 0) rotate(${rotation}deg) rotateY(${rotateY}deg) scale(${lift})`

      const progress = Math.min(Math.abs(st.currentX) / 120, 1)
      const matchInd = st.dragCard.querySelector<HTMLElement>('.match-indicator')
      const skipInd = st.dragCard.querySelector<HTMLElement>('.skip-indicator')
      if (st.currentX > 0) {
        if (matchInd) matchInd.style.opacity = String(progress * 0.9)
        if (skipInd) skipInd.style.opacity = '0'
      } else {
        if (skipInd) skipInd.style.opacity = String(progress * 0.9)
        if (matchInd) matchInd.style.opacity = '0'
      }

      const dragProgress = Math.min(Math.abs(st.currentX) / 100, 1)
      layoutPlanetsDrag(dragProgress)
    },
    [layoutPlanetsDrag],
  )

  const onPointerUp = useCallback(() => {
    const st = dragRef.current
    if (!st.isDragging || !st.dragCard) return
    st.isDragging = false
    const card = st.dragCard
    st.dragCard = null

    const matchInd = card.querySelector<HTMLElement>('.match-indicator')
    const skipInd = card.querySelector<HTMLElement>('.skip-indicator')

    const threshold = 100
    const velocityThreshold = 0.5
    const shouldSwipe = Math.abs(st.currentX) > threshold || Math.abs(st.velocityX) > velocityThreshold
    const direction: SwipeDir = st.currentX > 0 ? 'right' : 'left'

    if (shouldSwipe && Math.abs(st.currentX) > 30) {
      card.classList.remove('dragging')
      card.classList.add('exiting')
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      card.offsetWidth
      swipeCard(card, direction)
    } else {
      card.classList.remove('dragging')
      card.style.transform = 'scale(1) translateY(0)'
      if (matchInd) matchInd.style.opacity = '0'
      if (skipInd) skipInd.style.opacity = '0'
      layoutPlanets(true)
    }
  }, [layoutPlanets, swipeCard])

  // Re-render depths when cardIndex updates
  useEffect(() => {
    updateCardDepths(true)
  }, [cardIndex, updateCardDepths])

  // Init on mount or profiles change
  useEffect(() => {
    renderXPBar(xpState)
  }, [renderXPBar, xpState])

  useEffect(() => {
    cardIndexRef.current = 0
    setCardIndex(0)
    const snap = demoXpRef.current
    setXpState({ xp: snap.xp, level: snap.level })
    endStateRef.current?.classList.remove('show')
    if (actionButtonsRef.current) {
      actionButtonsRef.current.style.opacity = '1'
      actionButtonsRef.current.style.pointerEvents = 'auto'
    }
    activePlanetIdxRef.current = 0
    buildPlanets()
    renderCards()
  }, [buildPlanets, profiles, renderCards])

  useEffect(() => {
    initStarfield()
    animRef.current = requestAnimationFrame(drawStarfield)
    const move = (e: PointerEvent) => onPointerMove(e)
    const up = () => onPointerUp()
    document.addEventListener('pointermove', move, { passive: false })
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', up)
    const stack = cardStackRef.current
    stack?.addEventListener('pointerdown', onPointerDown)

    const vis = () => {
      if (document.hidden && animRef.current) cancelAnimationFrame(animRef.current)
      if (!document.hidden) animRef.current = requestAnimationFrame(drawStarfield)
    }
    document.addEventListener('visibilitychange', vis)

    return () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', up)
      stack?.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('visibilitychange', vis)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRestart = useCallback(() => {
    if (deckHintTimerRef.current) {
      clearTimeout(deckHintTimerRef.current)
      deckHintTimerRef.current = null
    }
    setDeckHint(null)
    deckEmptyNotifiedRef.current = false

    // 先触发父组件重新拉取一批新数据；
    // profiles 变化时下方的 useEffect 会自动重置 cardIndex / UI。
    onReloadRef.current()

    // 若当前 profiles 非空，同步重置 UI 以立即生效（不等待网络）
    if (cards.length > 0) {
      cardIndexRef.current = 0
      setCardIndex(0)
      const reset = { xp: SWIPE_DEMO_INITIAL_XP.xp, level: SWIPE_DEMO_INITIAL_XP.level }
      setXpState(reset)
      activePlanetIdxRef.current = 0
      meteorsRef.current = []
      buildPlanets()
      endStateRef.current?.classList.remove('show')
      if (actionButtonsRef.current) {
        actionButtonsRef.current.style.opacity = '1'
        actionButtonsRef.current.style.pointerEvents = 'auto'
      }
      renderXPBar(reset)
      renderCards()
    }
  }, [buildPlanets, cards.length, renderCards, renderXPBar])

  return (
    <div ref={containerRef} className="mc-swipe phone-frame min-h-0 flex-1">
      <canvas ref={canvasRef} className="mc-swipe__starfield" />
      <div className="mc-swipe__content app-content">
        <div className="mc-swipe__topbar top-bar justify-between">
          <Link
            href="/messages"
            className="relative flex shrink-0 items-center justify-center rounded-[8px] bg-white/[0.08] p-[4px] text-white transition-colors hover:bg-white/[0.14]"
            aria-label={tr('nav.messages')}
          >
            <IconSatelliteDish className="h-5 w-5 text-white/50" />
            {inboxBadgeTotal > 0 ? (
              <span className="absolute -right-[2px] -top-[2px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#e46d2e] px-[3px] text-[9px] font-bold leading-none text-white shadow-[0_1px_4px_rgba(228,109,46,0.6)]">
                {inboxBadgeTotal > 99 ? '99+' : inboxBadgeTotal}
              </span>
            ) : null}
          </Link>
          <div className="flex items-center gap-[8px]">
            <LanguageSwitcher />
            <div className="flex shrink-0 items-center gap-[2px] overflow-hidden rounded-[8px] bg-white/[0.08]">
              <button
                type="button"
                className="flex items-center justify-center rounded-[8px] p-[4px] transition-colors"
                aria-label={tr('nav.listView')}
                onClick={onSwitchToList}
              >
                <IconListBullet active={false} className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-[13px] bg-white/[0.15] p-[4px] transition-colors"
                aria-label={tr('nav.swipeView')}
                aria-pressed
                onClick={onSwitchToSwipe}
              >
                <IconSwipeStack active className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="xp-bar" id="xp-bar">
          <div className="xp-dots" ref={xpDotsRef} />
          <span className="xp-level" ref={xpLevelRef} />
          <div className="xp-track">
            <div className="xp-fill" ref={xpFillRef} />
          </div>
          <span className="xp-count" ref={xpCountRef} />
        </div>

        <div className="main-area">
          <div id="planet-layer">
            <div id="planet-track" ref={planetTrackRef} />
          </div>

          <div className="card-stack" ref={cardStackRef} />

          <div className="end-state" ref={endStateRef}>
            <div className="end-icon" aria-hidden>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="#e46d2e" strokeWidth="2" opacity="0.4" />
                <circle cx="40" cy="40" r="28" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.3" />
                <circle cx="40" cy="40" r="8" fill="#e46d2e" />
                <circle cx="20" cy="20" r="2" fill="#f59e0b" opacity="0.6" />
                <circle cx="60" cy="18" r="1.5" fill="#0d9488" opacity="0.5" />
                <circle cx="15" cy="55" r="1" fill="#8b5cf6" opacity="0.7" />
                <circle cx="62" cy="58" r="1.8" fill="#e46d2e" opacity="0.4" />
              </svg>
            </div>
            <h2 className="end-title">{tr('swipe.deckTitle')}</h2>
            <p className="end-subtitle">{tr('swipe.deckSubtitle', { count: cards.length })}</p>
            <button type="button" className="end-restart" onClick={handleRestart}>
              {tr('swipe.launchAgain')}
            </button>
            {deckHint ? (
              <p className="end-deck-hint" role="status">
                {deckHint}
              </p>
            ) : null}
          </div>

          <div className="action-buttons" ref={actionButtonsRef}>
            <div className="swipe-guides">
              <span className="swipe-guide swipe-guide-left">{tr('swipe.leftHint')}</span>
              <span className="swipe-guide swipe-guide-right">{tr('swipe.rightHint')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="xp-gain" ref={xpGainRef}>
        +30 XP
      </div>

      <div className="level-up-overlay" ref={levelOverlayRef}>
        <div className="level-up-content">
          <div className="level-up-burst" ref={levelBurstRef} />
          <div className="level-up-ring" ref={levelRingRef} />
          <h2 className="level-up-title" ref={levelTitleRef} />
          <p className="level-up-subtitle">{tr('swipe.levelUp')}</p>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#101837]/70">
          <p className="text-white/60 text-sm">{tr('common.loading')}</p>
        </div>
      )}
    </div>
  )
}

