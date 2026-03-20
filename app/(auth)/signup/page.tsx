'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendMagicLink, signUpWithPassword, checkEmailExists } from '@/supabase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      // Try to sign up - Supabase will reject if email exists
      const result = await signUpWithPassword(email, password)
      
      console.log('Signup result:', result)
      
      // If email confirmation is required, show the email sent screen
      if (result.needsConfirmation) {
        console.log('Email confirmation required - showing email sent screen')
        setEmailSent(true)
      } else {
        console.log('No email confirmation needed - redirecting to onboarding')
        // Session is created instantly when email confirmation is disabled
        // Redirect to onboarding
        window.location.href = '/onboarding'
      }
    } catch (err) {
      const errorMessage = (err as Error).message
      
      // Check if it's a duplicate email error
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        setShowExistingEmailModal(true)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Try to send magic link - Supabase will handle if email exists
      await sendMagicLink(email)
      setEmailSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121B3E] p-4 relative overflow-hidden">
        {/* Radial gradient blob */}
        <div 
          className="absolute pointer-events-none"
          style={{
            width: 442,
            height: 442,
            left: -23,
            top: 195,
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(193, 126, 69, 0.65) 0%, rgba(105.50, 76.50, 65.50, 0.82) 50%, #3E3440 70%, rgba(39.87, 39.37, 62.87, 0.96) 84%, #121B3E 100%)',
            boxShadow: '6.35px 6.35px 6.35px',
            borderRadius: 9999,
            filter: 'blur(3.18px)',
          }}
        />

        <div className="w-full max-w-[381px] flex flex-col items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-[rgba(231,119,15,0.2)] rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-white text-2xl font-bold text-center">Check your email!</h1>
          <p className="text-[#E6E6E6] text-center text-base">
            We sent a {method === 'password' ? 'confirmation' : 'magic'} link to{' '}
            <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-sm text-[#BFBFBF] text-center">
            Click the link in the email to {method === 'password' ? 'confirm your account and get started' : 'sign in and complete your profile'}.
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="w-[233px] py-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[25px] text-white hover:bg-[rgba(255,255,255,0.15)] transition-all"
          >
            Back to sign up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121B3E] p-4 relative overflow-hidden">
      {/* Radial gradient blob */}
      <div 
        className="absolute pointer-events-none"
        style={{
          width: 442,
          height: 442,
          left: -23,
          top: 195,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(193, 126, 69, 0.65) 0%, rgba(105.50, 76.50, 65.50, 0.82) 50%, #3E3440 70%, rgba(39.87, 39.37, 62.87, 0.96) 84%, #121B3E 100%)',
          boxShadow: '6.35px 6.35px 6.35px',
          borderRadius: 9999,
          filter: 'blur(3.18px)',
        }}
      />

      {/* Existing Email Modal */}
      {showExistingEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#121B3E] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-xl p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[rgba(231,119,15,0.2)] rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-white text-2xl font-bold text-center">Account Already Exists</h2>
              <p className="text-[#E6E6E6] text-center">
                An account with <span className="text-white font-medium">{email}</span> already exists
              </p>
              <p className="text-[#BFBFBF] text-center">
                You already have a MetaCreate account. Please sign in instead.
              </p>
              <div className="flex flex-col gap-3 w-full mt-2">
                <Link href="/login" className="w-full">
                  <button className="w-full py-[15px] bg-[#E7770F] hover:bg-[#d66d0d] rounded-[25px] text-white text-base font-medium">
                    Go to Login
                  </button>
                </Link>
                <button 
                  onClick={() => setShowExistingEmailModal(false)}
                  className="w-full py-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[25px] text-white hover:bg-[rgba(255,255,255,0.15)]"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[381px] flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-2">
            Join MetaCreate 🚀
          </h1>
          <p className="text-[#E6E6E6] text-lg">
            Start finding your co-creators
          </p>
        </div>

        <div className="w-full max-w-[330px] flex flex-col gap-6">
          {/* Method Toggle */}
          <div className="flex gap-2 p-1 bg-[rgba(255,255,255,0.10)] rounded-lg">
            <button
              onClick={() => setMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'password'
                  ? 'bg-[#E7770F] text-white'
                  : 'text-[#BFBFBF] hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'magic'
                  ? 'bg-[#E7770F] text-white'
                  : 'text-[#BFBFBF] hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={method === 'password' ? handlePasswordSignUp : handleMagicLink} className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-white text-sm leading-[14px]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-[15px] px-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[10px] text-white placeholder:text-[#BFBFBF] text-sm h-auto"
              />
            </div>

            {method === 'password' && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password" className="text-white text-sm leading-[14px]">
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
                    className="w-full py-[15px] px-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[10px] text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword" className="text-white text-sm leading-[14px]">
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
                    className="w-full py-[15px] px-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[10px] text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                  <p className="text-xs text-[#BFBFBF]">Must be at least 6 characters</p>
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
              className="w-[233px] mx-auto py-[15px] bg-[#E7770F] hover:bg-[#d66d0d] rounded-[25px] text-white text-base font-medium h-auto"
            >
              {loading ? 'Creating account...' : method === 'magic' ? 'Send Magic Link' : 'Create Account'}
            </Button>

            <p className="text-xs text-[#BFBFBF] text-center leading-relaxed">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Login Link */}
          <div className="pt-6 border-t border-[rgba(103.45,121.38,157.25,0.30)]">
            <p className="text-center text-[#BFBFBF] text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-[#E7770F] hover:text-[#d66d0d] font-medium transition-colors"
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
