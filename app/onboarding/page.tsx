'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileRepository } from '@/supabase/repos/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

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
    role: '' as 'Visionary' | 'Builder' | 'Strategist' | 'Connector' | '',
    skills: [] as string[],
    interests: [] as string[],
    collab_style: '' as 'Sprint-lover' | 'Marathon-runner' | 'Flexible' | '',
    availability: '' as 'Available' | 'Exploring' | 'Unavailable' | '',
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            {step === 1 && '🔥 Step 1: Ignition'}
            {step === 2 && '🌌 Step 2: Your Universe'}
            {step === 3 && '🚀 Step 3: Launch'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Step {step} of 3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-zinc-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-zinc-300">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="school" className="text-zinc-300">School/Organization</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="Columbia University"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.city || !formData.school}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Next →
              </Button>
            </div>
          )}

          {/* Step 2: Role & Skills */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Select Your Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Visionary', 'Builder', 'Strategist', 'Connector'] as const).map((role) => (
                    <Button
                      key={role}
                      onClick={() => setFormData({ ...formData, role })}
                      variant={formData.role === role ? 'default' : 'outline'}
                      className={formData.role === role ? 'bg-blue-600' : 'bg-zinc-800 border-zinc-700 text-white'}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Collaboration Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Sprint-lover', 'Marathon-runner', 'Flexible'] as const).map((style) => (
                    <Button
                      key={style}
                      onClick={() => setFormData({ ...formData, collab_style: style })}
                      variant={formData.collab_style === style ? 'default' : 'outline'}
                      className={formData.collab_style === style ? 'bg-blue-600 text-xs' : 'bg-zinc-800 border-zinc-700 text-white text-xs'}
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Availability</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Available', 'Exploring', 'Unavailable'] as const).map((avail) => (
                    <Button
                      key={avail}
                      onClick={() => setFormData({ ...formData, availability: avail })}
                      variant={formData.availability === avail ? 'default' : 'outline'}
                      className={formData.availability === avail ? 'bg-blue-600' : 'bg-zinc-800 border-zinc-700 text-white'}
                    >
                      {avail}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 bg-zinc-800 border-zinc-700 text-white">
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.role}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Launch */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="manifesto" className="text-zinc-300">Your Manifesto (optional)</Label>
                <Input
                  id="manifesto"
                  value={formData.manifesto}
                  onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                  placeholder="I build things that matter..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  One sentence about what drives you
                </p>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="text-sm text-zinc-400">Profile Summary</p>
                <p className="text-white font-medium">{formData.name}</p>
                <p className="text-zinc-300 text-sm">{formData.role} • {formData.city}</p>
                <p className="text-zinc-400 text-sm">{formData.school}</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 bg-zinc-800 border-zinc-700 text-white">
                  ← Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
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
