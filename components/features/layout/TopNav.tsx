'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function TopNav() {
  const router = useRouter()
  const { user, sessionUser, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    router.push('/login')
  }

  const displayName = user?.name?.trim() || sessionUser?.email?.split('@')[0] || 'You'
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/10 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(18,27,62,0.95)' }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/explore" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-white tracking-wide text-sm sm:text-base">
            Meta<span style={{ color: '#E7770F' }}>Create</span>
          </span>
        </Link>

        {/* Right side: avatar dropdown */}
        <div className="shrink-0 flex items-center gap-2">
          {sessionUser ? (
            <>
              <div className="relative" ref={dropdownRef}>
              {/* Avatar button */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{ background: 'linear-gradient(135deg,#E7770F,#f5a623)' }}
                aria-label="User menu"
              >
                {initials || '?'}
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-10 w-48 rounded-xl border border-white/10 shadow-xl overflow-hidden"
                  style={{ backgroundColor: '#1a2550' }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                    <p className="text-xs text-white/40 truncate">
                      {sessionUser.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/onboarding"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span>⚙️</span>
                      <span>Edit Onboarding</span>
                    </Link>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
