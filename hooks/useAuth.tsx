'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { UserProfile } from '@/types'
import { createClient } from '@/supabase/utils/client'
import { ProfileRepository } from '@/supabase/repos/profile'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: UserProfile | null
  sessionUser: User | null
  // loading: true only during the initial session check (fast, no network).
  // Once false, sessionUser tells you whether a session exists.
  loading: boolean
  // profileLoading: true while the UserProfile row is being fetched from Supabase.
  // Pages that need profile data (e.g. /main) should also check this.
  profileLoading: boolean
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  sessionUser: null,
  loading: true,
  profileLoading: false,
  logout: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  // loading: covers only the getSession() call — reads from cookies, no network.
  const [loading, setLoading] = useState(true)
  // profileLoading: covers the async Supabase DB fetch for the UserProfile row.
  const [profileLoading, setProfileLoading] = useState(false)
  // Stable ref avoids the lint warning about missing useEffect dependency
  // while ensuring the client is created only once per provider mount.
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const router = useRouter()

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    try {
      const profileRepo = new ProfileRepository()
      const profile = await profileRepo.getProfile(userId)
      setUser(profile)
    } catch (err) {
      console.error('Profile fetch failed:', err)
      setUser(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  /** 用 getSession 读当前用户，避免依赖 sessionUser 引用导致 useCallback 频繁失效 */
  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (uid) await fetchProfile(uid)
  }, [supabase, fetchProfile])

  useEffect(() => {
    // getSession() reads from cookies — instant, no network call.
    // Set loading=false as soon as we know the session status so pages
    // can unblock immediately instead of waiting for the profile fetch.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfileLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        throw error
      }
      setSessionUser(null)
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Failed to logout:', err)
    }
  }, [supabase, router])

  const value = useMemo(
    () => ({
      user,
      sessionUser,
      loading,
      profileLoading,
      logout,
      refreshProfile,
    }),
    [user, sessionUser, loading, profileLoading, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
