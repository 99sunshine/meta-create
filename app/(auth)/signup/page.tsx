'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/utils/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthBackground } from '@/components/features/onboarding'

type AuthMethod = 'password' | 'magic'

export default function SignUpPage() {
  const router = useRouter()
  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showExistingEmailModal, setShowExistingEmailModal] = useState(false)
  const supabase = createClient()

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        // Check if it's a duplicate email error
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setShowExistingEmailModal(true)
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }
      
      // Check if we have a session - if yes, email confirmation is disabled
      if (data.session && data.user) {
        // No email confirmation needed - create profile and redirect
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
        
        // Redirect to onboarding
        router.push('/onboarding')
      } else if (data.user) {
        // No session = email confirmation is required
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
          <h1 className="text-figma-text-primary text-2xl font-bold text-center">Check your email!</h1>
          <p className="text-figma-text-secondary text-center text-base">
            We sent a {method === 'password' ? 'confirmation' : 'magic'} link to{' '}
            <span className="text-figma-text-primary font-medium">{email}</span>
          </p>
          <p className="text-sm text-figma-text-tertiary text-center">
            Click the link in the email to {method === 'password' ? 'confirm your account and get started' : 'sign in and complete your profile'}.
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="w-56 py-4 bg-figma-input-bg border border-figma-input-border rounded-full text-figma-text-primary hover:bg-[rgba(255,255,255,0.15)] transition-all"
          >
            Back to sign up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
      <AuthBackground />

      {/* Existing Email Modal */}
      {showExistingEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-figma-bg border border-figma-input-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-figma-accent/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-figma-text-primary text-2xl font-bold text-center">Account Already Exists</h2>
              <p className="text-figma-text-secondary text-center">
                An account with <span className="text-figma-text-primary font-medium">{email}</span> already exists
              </p>
              <p className="text-figma-text-tertiary text-center">
                You already have a MetaCreate account. Please sign in instead.
              </p>
              <div className="flex flex-col gap-3 w-full mt-2">
                <Link href="/login" className="w-full">
                  <button className="w-full py-4 bg-figma-accent hover:bg-figma-accent/90 rounded-full text-figma-text-primary text-base font-medium">
                    Go to Login
                  </button>
                </Link>
                <button 
                  onClick={() => setShowExistingEmailModal(false)}
                  className="w-full py-4 bg-figma-input-bg border border-figma-input-border rounded-full text-figma-text-primary hover:bg-[rgba(255,255,255,0.15)]"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-figma-text-primary text-3xl font-bold mb-2">
            Join MetaCreate 🚀
          </h1>
          <p className="text-figma-text-secondary text-lg">
            Start finding your co-creators
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
              Password
            </button>
            <button
              onClick={() => setMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'magic'
                  ? 'bg-figma-accent text-figma-text-primary'
                  : 'text-figma-text-tertiary hover:text-figma-text-primary'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={method === 'password' ? handlePasswordSignUp : handleMagicLink} className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-figma-text-primary text-sm leading-[14px]">
                Email
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
                    Password
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
                    Confirm Password
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
                  <p className="text-xs text-figma-text-tertiary">Must be at least 6 characters</p>
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
              {loading ? 'Creating account...' : method === 'magic' ? 'Send Magic Link' : 'Create Account'}
            </Button>

            <p className="text-xs text-figma-text-tertiary text-center leading-relaxed">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Login Link */}
          <div className="pt-6 border-t border-[rgba(103.45,121.38,157.25,0.30)]">
            <p className="text-center text-figma-text-tertiary text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-figma-accent hover:text-figma-accent/90 font-medium transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
