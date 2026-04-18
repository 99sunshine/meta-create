'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCreateFlowOptional } from '@/components/providers/CreateFlowProvider'

type BottomTabsProps = {
  onCreate?: () => void
}

function IconDiscover({ active }: { active: boolean }) {
  const c = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke={c}
        strokeWidth="2"
      />
      <path
        d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z"
        fill={active ? 'rgba(244,140,36,0.95)' : 'rgba(255,255,255,0.45)'}
      />
    </svg>
  )
}

function IconMe({ active }: { active: boolean }) {
  const c = active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z" stroke={c} strokeWidth="2" />
      <path d="M4 22a8 8 0 0 1 16 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FabStarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      {/* 4-pointed star / sparkle — matches Figma FAB icon */}
      <path
        d="M11 2 C11 2 11.9 7.1 14.2 9.4 C16.5 11.7 21 11 21 11 C21 11 16.5 11.3 14.2 13.6 C11.9 15.9 11 20 11 20 C11 20 10.1 15.9 7.8 13.6 C5.5 11.3 1 11 1 11 C1 11 5.5 11.7 7.8 9.4 C10.1 7.1 11 2 11 2 Z"
        fill="rgba(255,255,255,0.92)"
      />
    </svg>
  )
}

const LEFT = { key: 'explore', label: 'Explore', href: '/explore' } as const
const RIGHT = { key: 'me', label: 'Me', href: '/profile' } as const

export default function BottomTabs({ onCreate }: BottomTabsProps) {
  const pathname = usePathname()
  const createFlow = useCreateFlowOptional()

  const handleFab = () => {
    if (createFlow) createFlow.openPrimaryPicker()
    else onCreate?.()
  }

  const exploreActive = pathname === LEFT.href || pathname.startsWith(`${LEFT.href}/`)
  const meActive = pathname === RIGHT.href || pathname.startsWith(`${RIGHT.href}/`)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.04) 100%), linear-gradient(90deg, rgb(16,24,55) 0%, rgb(16,24,55) 100%)',
      }}
      aria-label="Bottom navigation"
    >
      <div
        className="mx-auto flex max-w-6xl items-stretch pt-[8px] pb-[max(20px,env(safe-area-inset-bottom))]"
      >
        {/* Explore */}
        <Link
          href={LEFT.href}
          aria-current={exploreActive ? 'page' : undefined}
          className="flex flex-1 flex-col items-center justify-center gap-[3px] min-h-[48px]"
        >
          <span className="flex size-[22px] items-center justify-center">
            <IconDiscover active={exploreActive} />
          </span>
          <span
            className="text-[10px] leading-none font-normal"
            style={{ color: exploreActive ? '#ffffff' : '#6b7280' }}
          >
            {LEFT.label}
          </span>
        </Link>

        {/* FAB — 中间列，垂直居中 */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleFab}
            aria-label="创建"
            className="flex size-[52px] shrink-0 items-center justify-center rounded-[26px] transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #194cb2 0%, #f48c24 100%)',
              boxShadow: '0 4px 20px rgba(244,140,36,0.40)',
            }}
          >
            <FabStarIcon />
          </button>
        </div>

        {/* Me */}
        <Link
          href={RIGHT.href}
          aria-current={meActive ? 'page' : undefined}
          className="flex flex-1 flex-col items-center justify-center gap-[3px] min-h-[48px]"
        >
          <span className="flex size-[22px] items-center justify-center">
            <IconMe active={meActive} />
          </span>
          <span
            className="text-[10px] leading-none font-normal"
            style={{ color: meActive ? '#ffffff' : '#6b7280' }}
          >
            {RIGHT.label}
          </span>
        </Link>
      </div>
    </nav>
  )
}
