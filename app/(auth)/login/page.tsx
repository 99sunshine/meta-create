'use client'

import { useState } from 'react'
import { sendMagicLink } from '@/supabase/auth'
import { LoginForm } from '@/components/features/login/LoginForm'
import { EmailSent } from '@/components/features/login/EmailSent'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await sendMagicLink(email)
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {sent ? (
        <EmailSent email={email} />
      ) : (
        <LoginForm
          email={email}
          setEmail={setEmail}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      )}
    </div>
  )
}
