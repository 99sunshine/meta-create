'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/utils/client'
import { checkEmailExists } from '@/supabase/auth'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthBackground } from '@/components/features/onboarding'
import { trackEvent } from '@/lib/analytics'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

type AuthMethod = 'password' | 'magic'

export default function SignUpPage() {
  const router = useRouter()
  const { sessionUser, loading: authLoading, refreshProfile } = useAuth()
  const { tr } = useLocale()
  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showExistingEmailModal, setShowExistingEmailModal] = useState(false)
  const [signingUp, setSigningUp] = useState(false)
  const onboardingRedirectRef = useRef(false)
  const supabase = createClient()

  // After session is established, force-refresh the profile to ensure the row
  // inserted during signup is loaded into AuthContext (user.onboarding_complete
  // = false). Without this, onAuthStateChange can race with the INSERT and
  // fetchProfile returns null, causing the /main onboarding banner to not show.
  // 只跳转一次：避免 refreshProfile / Context value 变化导致 effect 连发 router.push。
  useEffect(() => {
    if (!signingUp || authLoading || !sessionUser || onboardingRedirectRef.current) return
    onboardingRedirectRef.current = true
    void refreshProfile().finally(() => {
      router.replace('/onboarding')
    })
  }, [signingUp, authLoading, sessionUser, router, refreshProfile])

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError(tr('auth.passwordsMismatch'))
      setLoading(false)
      return
    }

    try {
      // N1: Check for duplicate email before calling signUp to avoid relying
      // on fragile error-message string matching.
      const exists = await checkEmailExists(email)
      if (exists) {
        setShowExistingEmailModal(true)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.session && data.user) {
        // Email confirmation is disabled — session is available immediately.
        // Create a minimal profile and let the useEffect above handle the redirect.
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: '',
            role: 'Builder',
            onboarding_complete: false,
          })

        if (profileError) {
          console.error('Profile creation failed:', profileError)
        }

        trackEvent('user_signed_up', { method: 'password' })
        setSigningUp(true)
      } else if (data.user) {
        // Email confirmation required — show "check your email" screen.
        setEmailSent(true)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      
      setEmailSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
        <AuthBackground />

        <div className="w-full max-w-sm flex flex-col items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-figma-accent/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-figma-text-primary text-2xl font-bold text-center">{tr('auth.checkEmail')}</h1>
          <p className="text-figma-text-secondary text-center text-base">
            {tr('auth.sentLink', {
              kind: method === 'password' ? tr('auth.sentLinkKindPassword') : tr('auth.sentLinkKindMagic'),
              email,
            })}
          </p>
          <p className="text-sm text-figma-text-tertiary text-center">
            {method === 'password' ? tr('auth.sentLinkHelpPassword') : tr('auth.sentLinkHelpMagic')}
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="w-56 py-4 bg-figma-input-bg border border-figma-input-border rounded-full text-figma-text-primary hover:bg-[rgba(255,255,255,0.15)] transition-all"
          >
            {tr('auth.backToSignup')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
      <AuthBackground />
      <LanguageSwitcher className="absolute right-4 top-4 z-20" />

      {/* Existing Email Modal */}
      {showExistingEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-figma-bg border border-figma-input-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-figma-accent/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-figma-text-primary text-2xl font-bold text-center">{tr('auth.accountExists')}</h2>
              <p className="text-figma-text-secondary text-center">
                {tr('auth.accountExistsDesc', { email })}
              </p>
              <p className="text-figma-text-tertiary text-center">
                {tr('auth.accountExistsHelp')}
              </p>
              <div className="flex flex-col gap-3 w-full mt-2">
                <Link href="/login" className="w-full">
                  <button className="w-full py-4 bg-figma-accent hover:bg-figma-accent/90 rounded-full text-figma-text-primary text-base font-medium">
                    {tr('auth.goToLogin')}
                  </button>
                </Link>
                <button 
                  onClick={() => setShowExistingEmailModal(false)}
                  className="w-full py-4 bg-figma-input-bg border border-figma-input-border rounded-full text-figma-text-primary hover:bg-[rgba(255,255,255,0.15)]"
                >
                  {tr('auth.tryAnotherEmail')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-figma-text-primary text-3xl font-bold mb-2">
            {tr('auth.join')}
          </h1>
          <p className="text-figma-text-secondary text-lg">
            {tr('auth.startFinding')}
          </p>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-6">
          {/* Method Toggle */}
          <div className="flex gap-2 p-1 bg-figma-input-bg rounded-lg">
            <button
              onClick={() => setMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'password'
                  ? 'bg-figma-accent text-figma-text-primary'
                  : 'text-figma-text-tertiary hover:text-figma-text-primary'
              }`}
            >
              {tr('auth.password')}
            </button>
            <button
              onClick={() => setMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'magic'
                  ? 'bg-figma-accent text-figma-text-primary'
                  : 'text-figma-text-tertiary hover:text-figma-text-primary'
              }`}
            >
              {tr('auth.magicLink')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={method === 'password' ? handlePasswordSignUp : handleMagicLink} className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-figma-text-primary text-sm leading-[14px]">
                {tr('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-4 px-4 bg-figma-input-bg border border-figma-input-border rounded-lg text-figma-text-primary placeholder:text-figma-text-tertiary text-sm h-auto"
              />
            </div>

            {method === 'password' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password" className="text-figma-text-primary text-sm leading-[14px]">
                    {tr('auth.password')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full py-4 px-4 bg-figma-input-bg border border-figma-input-border rounded-lg text-figma-text-primary placeholder:text-figma-text-tertiary text-sm h-auto"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword" className="text-figma-text-primary text-sm leading-[14px]">
                    {tr('auth.confirmPassword')}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full py-4 px-4 bg-figma-input-bg border border-figma-input-border rounded-lg text-figma-text-primary placeholder:text-figma-text-tertiary text-sm h-auto"
                  />
                  <p className="text-xs text-figma-text-tertiary">{tr('auth.minPassword')}</p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-56 mx-auto py-4 bg-figma-accent hover:bg-figma-accent/90 rounded-full text-figma-text-primary text-base font-medium h-auto"
            >
              {loading ? tr('auth.creatingAccount') : method === 'magic' ? tr('auth.sendMagicLink') : tr('auth.createAccount')}
            </Button>

            <p className="text-xs text-figma-text-tertiary text-center leading-relaxed">
              {tr('auth.terms')}
            </p>
          </form>

          {/* Login Link */}
          <div className="pt-6 border-t border-[rgba(103.45,121.38,157.25,0.30)]">
            <p className="text-center text-figma-text-tertiary text-sm">
              {tr('auth.alreadyHaveAccount')}{' '}
              <Link 
                href="/login" 
                className="text-figma-accent hover:text-figma-accent/90 font-medium transition-colors"
              >
                {tr('auth.signInInstead')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
