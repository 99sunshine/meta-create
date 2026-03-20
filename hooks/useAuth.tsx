'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserProfile } from '@/types'
import { createClient } from '@/supabase/utils/client'
import { ProfileRepository } from '@/supabase/repos/profile'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: UserProfile | null
  sessionUser: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  sessionUser: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchProfile = async (userId: string) => {
    try {
      const profileRepo = new ProfileRepository()
      const profile = await profileRepo.getProfile(userId)
      setUser(profile)
    } catch (err) {
      console.error('Profile fetch failed:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (sessionUser) {
      await fetchProfile(sessionUser.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSessionUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSessionUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setSessionUser(null)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, sessionUser, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
