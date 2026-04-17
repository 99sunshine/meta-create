'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserProfile } from '@/types'

const SWIPE_THRESHOLD = 80     // px to count as a swipe
const ROTATION_FACTOR = 0.08   // deg per px

export type SwipeDirection = 'left' | 'right'

interface Props {
  profiles: UserProfile[]
  onSwipe: (profile: UserProfile, dir: SwipeDirection) => void
  onEmpty: () => void
}

interface CardState {
  profile: UserProfile
  x: number
  y: number
  rotation: number
  dragging: boolean
  gone: boolean
}

export function SwipeStack({ profiles, onSwipe, onEmpty }: Props) {
  const [cards, setCards] = useState<CardState[]>(() =>
    profiles.map((p) => ({ profile: p, x: 0, y: 0, rotation: 0, dragging: false, gone: false })),
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCards(profiles.map((p) => ({ profile: p, x: 0, y: 0, rotation: 0, dragging: false, gone: false })))
  }, [profiles])

  const activeCards = cards.filter((c) => !c.gone)

  useEffect(() => {
    if (cards.length > 0 && activeCards.length === 0) onEmpty()
  }, [activeCards.length, cards.length, onEmpty])

  const updateCard = useCallback((idx: number, updates: Partial<CardState>) => {
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)))
  }, [])

  const flyOut = useCallback(
    (idx: number, dir: SwipeDirection) => {
      const targetX = dir === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5
      const targetRot = dir === 'right' ? 30 : -30
      updateCard(idx, { x: targetX, rotation: targetRot, dragging: false, gone: true })
      onSwipe(cards[idx].profile, dir)
    },
    [cards, onSwipe, updateCard],
  )

  return (
    <div className="relative w-full h-full">
      {cards.map((card, idx) => {
        if (card.gone) return null
        const stackOffset = activeCards.length - 1 - activeCards.findIndex((c) => c.profile.id === card.profile.id)
        return (
          <SwipeCard
            key={card.profile.id}
            card={card}
            stackOffset={stackOffset}
            onUpdateCard={(updates) => updateCard(idx, updates)}
            onFlyOut={(dir) => flyOut(idx, dir)}
            isTop={stackOffset === 0}
          />
        )
      })}
    </div>
  )
}

interface SwipeCardProps {
  card: CardState
  stackOffset: number
  isTop: boolean
  onUpdateCard: (u: Partial<CardState>) => void
  onFlyOut: (dir: SwipeDirection) => void
}

function SwipeCard({ card, stackOffset, isTop, onUpdateCard, onFlyOut }: SwipeCardProps) {
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isTop) return
      e.currentTarget.setPointerCapture(e.pointerId)
      startRef.current = { x: e.clientX, y: e.clientY }
      onUpdateCard({ dragging: true })
    },
    [isTop, onUpdateCard],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || !card.dragging) return
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      onUpdateCard({ x: dx, y: dy, rotation: dx * ROTATION_FACTOR })
    },
    [card.dragging, onUpdateCard],
  )

  const handlePointerUp = useCallback(() => {
    if (!startRef.current) return
    startRef.current = null
    if (Math.abs(card.x) > SWIPE_THRESHOLD) {
      onFlyOut(card.x > 0 ? 'right' : 'left')
    } else {
      onUpdateCard({ x: 0, y: 0, rotation: 0, dragging: false })
    }
  }, [card.x, onFlyOut, onUpdateCard])

  const scale = 1 - stackOffset * 0.04
  const translateY = stackOffset * 12
  const profile = card.profile
  const skills = (profile.skills ?? []) as string[]
  const initials = (profile.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const likeOpacity = Math.max(0, Math.min(1, card.x / 60))
  const nopeOpacity = Math.max(0, Math.min(1, -card.x / 60))

  return (
    <div
      className="absolute inset-0 select-none touch-none"
      style={{
        transform: card.dragging
          ? `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg)`
          : `translate(${card.x}px, ${card.y}px) rotate(${card.rotation}deg) translateY(${translateY}px) scale(${scale})`,
        transition: card.dragging ? 'none' : 'transform 0.3s ease',
        zIndex: 10 - stackOffset,
        cursor: isTop ? 'grab' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Card */}
      <div
        className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(160deg, #1a2550 0%, #101837 100%)' }}
      >
        {/* Gradient overlay for avatar area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
          {/* Avatar */}
          <div
            className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-bold text-white ring-4 ring-white/15"
            style={{ background: 'linear-gradient(135deg,#E7770F,#f5a623)' }}
          >
            {initials}
          </div>

          {/* Name + role */}
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{profile.name ?? 'Creator'}</p>
            {profile.role && (
              <span className="inline-block mt-1 text-sm text-[#e46d2e] bg-[rgba(228,109,46,0.15)] border border-[rgba(228,109,46,0.3)] px-3 py-0.5 rounded-full">
                {profile.role}
              </span>
            )}
          </div>

          {/* Manifesto */}
          {profile.manifesto && (
            <p className="text-center text-sm text-white/60 italic leading-relaxed line-clamp-3 max-w-xs">
              &ldquo;{profile.manifesto}&rdquo;
            </p>
          )}

          {/* Skills chips */}
          {skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {skills.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 border border-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* School / City */}
          <div className="flex gap-3 text-xs text-white/40">
            {profile.school && <span>🎓 {profile.school}</span>}
            {profile.city && <span>📍 {profile.city}</span>}
          </div>
        </div>

        {/* LIKE / NOPE overlays */}
        {isTop && (
          <>
            <div
              className="absolute top-10 left-8 text-green-400 text-3xl font-black border-4 border-green-400 rounded-xl px-3 py-1 rotate-[-20deg]"
              style={{ opacity: likeOpacity }}
            >
              CONNECT
            </div>
            <div
              className="absolute top-10 right-8 text-red-400 text-3xl font-black border-4 border-red-400 rounded-xl px-3 py-1 rotate-[20deg]"
              style={{ opacity: nopeOpacity }}
            >
              SKIP
            </div>
          </>
        )}
      </div>
    </div>
  )
}
