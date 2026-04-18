'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type BottomTabsProps = {
  onCreate?: () => void
}

function IconDiscover({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
        stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2"
      />
      <path
        d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z"
        fill={active ? 'rgba(231,119,15,0.95)' : 'rgba(255,255,255,0.45)'}
      />
    </svg>
  )
}

function IconMe({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z"
        stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2"
      />
      <path
        d="M4 22a8 8 0 0 1 16 0"
        stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ITEMS = [
  { key: 'explore', label: 'Explore', href: '/explore' },
  { key: 'me', label: 'Me', href: '/profile' },
] as const

export default function BottomTabs({ onCreate }: BottomTabsProps) {
  const pathname = usePathname()
  // Spec: 2-tab bottom nav. Create entry handled elsewhere.
  // onCreate kept for compatibility with callers.
  void onCreate

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-sm"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.04) 100%), linear-gradient(90deg, rgb(16, 24, 55) 0%, rgb(16, 24, 55) 100%)',
      }}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex h-[83px] max-w-6xl items-start justify-center px-8 pb-5 pt-2">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const labelColor = active ? 'text-white' : 'text-[#6b7280]'

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-[6px]"
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden className="h-[22px] w-[22px]">
                {item.key === 'explore' ? <IconDiscover active={active} /> : <IconMe active={active} />}
              </span>
              <span className={`text-[10px] leading-none ${labelColor}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

