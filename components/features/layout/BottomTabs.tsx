'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type BottomTabsProps = {
  onCreate?: () => void
}

const ITEMS = [
  { key: 'explore', label: 'Explore', href: '/explore', icon: '🪐' },
  { key: 'community', label: 'Community', href: '/community', icon: '🛰️' },
  { key: 'create', label: '+', href: '', icon: '✦' },
  { key: 'messages', label: 'Messages', href: '/messages', icon: '📡' },
  { key: 'me', label: 'Me', href: '/profile', icon: '👩‍🚀' },
] as const

export default function BottomTabs({ onCreate }: BottomTabsProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 backdrop-blur-sm"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.04) 100%), linear-gradient(90deg, rgb(16, 24, 55) 0%, rgb(16, 24, 55) 100%)',
      }}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex h-[83px] max-w-6xl items-start justify-center px-2 pb-5 pt-2">
        {ITEMS.map((item) => {
          if (item.key === 'create') {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => (onCreate ? onCreate() : router.push('/explore'))}
                className="flex flex-1 flex-col items-center justify-center"
                aria-label="Create"
              >
                <div
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-[26px] text-white shadow-[0px_0px_18px_rgba(228,109,46,0.35)]"
                  style={{ backgroundImage: 'linear-gradient(180deg,#194cb2 0%, #f48c24 100%)' }}
                >
                  <span aria-hidden className="text-xl leading-none">
                    {item.icon}
                  </span>
                </div>
              </button>
            )
          }

          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const labelColor = active ? 'text-white' : 'text-[#6b7280]'

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-[3px]"
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden className="text-[18px]">
                {item.icon}
              </span>
              <span className={`text-[10px] leading-none ${labelColor}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

