'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileRepository } from '@/supabase/repos/profile'
import { isAppLocale, t, type AppLocale } from '@/lib/i18n'

const STORAGE_KEY = 'metacreate.locale'

type LocaleContextType = {
  locale: AppLocale
  setLocale: (next: AppLocale) => Promise<void>
  tr: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: async () => {},
  tr: (key) => key,
})

export const useLocale = () => useContext(LocaleContext)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user, sessionUser, refreshProfile } = useAuth()
  const repoRef = useRef(new ProfileRepository())
  const [locale, setLocaleState] = useState<AppLocale>('en')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isAppLocale(saved)) setLocaleState(saved)
  }, [])

  useEffect(() => {
    if (!isAppLocale(user?.locale)) return
    setLocaleState(user.locale)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, user.locale)
    }
  }, [user?.locale])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next)
      }
      if (!sessionUser) return
      try {
        await repoRef.current.updateProfile(sessionUser.id, { locale: next })
        await refreshProfile()
      } catch {
        // Keep local state even if remote sync fails.
      }
    },
    [sessionUser, refreshProfile],
  )

  const tr = useCallback((key: string, vars?: Record<string, string | number>) => t(locale, key, vars), [locale])

  const value = useMemo(() => ({ locale, setLocale, tr }), [locale, setLocale, tr])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
