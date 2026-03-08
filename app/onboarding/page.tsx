'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileRepository } from '@/supabase/repos/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { ROLES } from '@/constants/roles'
import { COLLAB_STYLES, AVAILABILITIES } from '@/constants/enums'
import type { Role } from '@/types/interfaces/Role'
import type { Availability } from '@/types/interfaces/Enums'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const { sessionUser, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    city: '',
    school: '',
    // Step 2
    role: '' as Role | '',
    skills: [] as string[],
    interests: [] as string[],
    collab_style: '',
    availability: '' as Availability | '',
    // Step 3
    tags: [] as string[],
    manifesto: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.push('/login')
    }
  }, [loading, sessionUser, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (!sessionUser) {
    return null
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const profileRepo = new ProfileRepository()
      
      // Create or update profile
      await profileRepo.updateProfile(sessionUser.id, {
        name: formData.name,
        city: formData.city,
        school: formData.school,
        role: formData.role,
        skills: formData.skills.length > 0 ? formData.skills : null,
        interests: formData.interests.length > 0 ? formData.interests : null,
        collab_style: formData.collab_style || null,
        availability: formData.availability || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        manifesto: formData.manifesto || null,
        onboarding_complete: true,
      })

      await refreshProfile()
      router.push('/')
    } catch (error) {
      console.error('Onboarding failed:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
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

      <Card className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl relative z-10">
        <CardHeader className="pb-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s === step
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                    : s < step
                    ? 'bg-blue-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <CardTitle className="text-white text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {step === 1 && '🔥 Ignition'}
            {step === 2 && '🌌 Your Universe'}
            {step === 3 && '🚀 Launch'}
          </CardTitle>
          <CardDescription className="text-slate-400 text-center text-lg mt-2">
            {step === 1 && "Let's set up your creator identity"}
            {step === 2 && "Define your creator DNA"}
            {step === 3 && "Ready to go live!"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="name" className="text-slate-300 text-base font-medium">
                  Display Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg mt-2"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-slate-300 text-base font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg mt-2"
                />
              </div>
              <div>
                <Label htmlFor="school" className="text-slate-300 text-base font-medium">
                  School/Organization
                </Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="Columbia University"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg mt-2"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.city || !formData.school}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold mt-6"
              >
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2: Role & Collaboration */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-slate-300 text-base font-medium mb-4 block">
                  Select Your Role
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    return (
                      <button
                        key={role.name}
                        onClick={() => setFormData({ ...formData, role: role.name })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.role === role.name
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mb-2 ${formData.role === role.name ? 'text-blue-400' : 'text-slate-400'}`} />
                        <div className="font-semibold text-white">{role.name}</div>
                        <div className="text-sm text-slate-400 mt-1">{role.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-base font-medium mb-3 block">
                  Collaboration Style
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {COLLAB_STYLES.map((style) => (
                    <Button
                      key={style}
                      onClick={() => setFormData({ ...formData, collab_style: style })}
                      variant={formData.collab_style === style ? 'default' : 'outline'}
                      className={`h-auto py-3 text-sm ${
                        formData.collab_style === style
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0'
                          : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300 text-base font-medium mb-3 block">
                  Current Availability
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {AVAILABILITIES.map((avail) => (
                    <Button
                      key={avail}
                      onClick={() => setFormData({ ...formData, availability: avail })}
                      variant={formData.availability === avail ? 'default' : 'outline'}
                      className={`py-3 ${
                        formData.availability === avail
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0'
                          : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {avail}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 h-12"
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.role}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 font-semibold"
                >
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Launch */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="manifesto" className="text-slate-300 text-base font-medium">
                  Your Manifesto <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="manifesto"
                  value={formData.manifesto}
                  onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                  placeholder="I build things that matter..."
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg mt-2"
                />
                <p className="text-sm text-slate-500 mt-2">
                  One sentence about what drives you as a creator
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-6 rounded-xl border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-3 uppercase tracking-wide">Profile Summary</p>
                <div className="space-y-2">
                  <p className="text-white font-semibold text-xl">{formData.name}</p>
                  <div className="flex items-center gap-2 text-blue-400">
                    <span className="px-3 py-1 bg-blue-500/20 rounded-full text-sm font-medium">
                      {formData.role}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{formData.city}</span>
                  </div>
                  <p className="text-slate-400">{formData.school}</p>
                  {formData.manifesto && (
                    <p className="text-slate-300 italic mt-3 pt-3 border-t border-slate-700">
                      &quot;{formData.manifesto}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 h-12"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
                >
                  {saving ? 'Launching...' : 'Launch Profile 🚀'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

