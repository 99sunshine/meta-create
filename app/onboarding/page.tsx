'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileRepository } from '@/supabase/repos/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
import { ROLES } from '@/constants/roles'
import { COLLAB_STYLES, AVAILABILITIES, SKILLS_POOL, INTERESTS_POOL, TAGS_POOL } from '@/constants/enums'
import type { Role } from '@/types/interfaces/Role'
import type { Availability } from '@/types/interfaces/Enums'
import {
  MetaFire,
  OnboardingProgress,
  TrackSelection,
  ResumeUpload,
  PhotoUpload,
  AuthBackground,
} from '@/components/features/onboarding'

type Step = 'track' | 1 | 2 | 3
type Track = 'fast' | 'manual' | null

export default function OnboardingPage() {
  const { sessionUser, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('track')
  const [track, setTrack] = useState<Track>(null)
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    city: '',
    school: '',
    email: sessionUser?.email || '',
    photo: null as File | null,
    resume: null as File | null,
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
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.push('/login')
    }
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (sessionUser?.email) {
      setFormData(prev => ({ ...prev, email: sessionUser.email || '' }))
    }
  }, [sessionUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121B3E]">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (!sessionUser) {
    return null
  }

  const handleTrackSelect = (selectedTrack: 'fast' | 'manual' | 'browse') => {
    if (selectedTrack === 'browse') {
      router.push('/explore')
      return
    }
    setTrack(selectedTrack)
    setStep(1)
  }

  const toggleChip = (field: 'skills' | 'interests' | 'tags', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

  const handleComplete = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const profileRepo = new ProfileRepository()

      await profileRepo.updateProfile(sessionUser.id, {
        name: formData.name,
        city: formData.city,
        school: formData.school,
        role: formData.role as Role,
        skills: formData.skills.length > 0 ? formData.skills : null,
        interests: formData.interests.length > 0 ? formData.interests : null,
        collab_style: formData.collab_style || null,
        availability: formData.availability as Availability || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        manifesto: formData.manifesto || null,
        onboarding_complete: true,
      })

      await refreshProfile()
      trackEvent('onboarding_completed', { role: formData.role, skills_count: formData.skills.length })
      router.push('/explore')
    } catch (error) {
      console.error('Onboarding failed:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const currentStepNumber = step === 'track' ? 0 : step as number

  return (
    <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-sm flex flex-col items-center gap-5 relative z-10">
        {/* Track Selection */}
        {step === 'track' && <TrackSelection onSelectTrack={handleTrackSelect} />}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <OnboardingProgress currentStep={1} totalSteps={3} />
            
            <MetaFire 
              message={track === 'fast' 
                ? "Off to a great start!<br/>I'll help extract your story.<br/>You'll review everything before it goes live."
                : "Let's start simple.<br/>Just the basics."
              }
            />

            <div className="w-full max-w-xs flex flex-col gap-[50px]">
              {track === 'fast' && (
                <ResumeUpload
                  onFileSelect={(file) => setFormData({ ...formData, resume: file })}
                  selectedFile={formData.resume}
                />
              )}

              {track === 'manual' && (
                <PhotoUpload
                  onPhotoSelect={(file) => setFormData({ ...formData, photo: file })}
                  selectedPhoto={null}
                />
              )}

              <div className="flex flex-col gap-[31px]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-white text-sm leading-[14px]">
                    Display Name*
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="How should others see you?"
                    className="w-full py-4 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="school" className="text-white text-sm leading-[14px]">
                    School/Organization
                  </Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="Start typing..."
                    className="w-full py-4 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="city" className="text-white text-sm leading-[14px]">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York, Beijing..."
                    className="w-full py-4 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-white text-sm leading-[14px]">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@school.edu"
                    className="w-full py-4 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                    disabled
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.city || !formData.school}
                className="w-56 mx-auto py-4 bg-[#E7770F] hover:bg-[#d66d0d] rounded-full text-white text-base font-medium h-auto"
              >
                Next →
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Role & Skills */}
        {step === 2 && (
          <>
            <OnboardingProgress currentStep={2} totalSteps={3} />
            
            <MetaFire message="Now... what are your superpowers?<br/>Pick at least 3. This helps me match you with<br/>other meta-creators." />

            <div className="w-full max-w-xs flex flex-col gap-[50px]">
              <div className="flex flex-col gap-[25px]">
                <div>
                  <Label className="text-white text-base font-medium mb-4 block">
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
                              ? 'border-[#E7770F] bg-[#E7770F]/20'
                              : 'border-[rgba(103.45,121.38,157.25,0.50)] bg-[rgba(255,255,255,0.10)] hover:border-[#E7770F]/50'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mb-2 ${formData.role === role.name ? 'text-[#E7770F]' : 'text-slate-400'}`} />
                          <div className="font-semibold text-white text-sm">{role.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{role.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-white text-base font-medium mb-3 block">
                    Skills <span className="text-slate-400 font-normal text-sm">(select at least 3)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS_POOL.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleChip('skills', skill)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          formData.skills.includes(skill)
                            ? 'bg-[#E7770F] text-white'
                            : 'bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] text-slate-300 hover:border-[#E7770F]/50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  {formData.skills.length > 0 && (
                    <p className="text-xs text-[#E7770F] mt-2">{formData.skills.length} selected</p>
                  )}
                </div>

                <div>
                  <Label className="text-white text-base font-medium mb-3 block">
                    Interests <span className="text-slate-400 font-normal text-sm">(optional)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS_POOL.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleChip('interests', interest)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          formData.interests.includes(interest)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] text-slate-300 hover:border-indigo-400/50'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white text-base font-medium mb-3 block">
                    Collaboration Style
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {COLLAB_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setFormData({ ...formData, collab_style: style })}
                        className={`py-3 px-2 text-sm rounded-lg transition-all ${
                          formData.collab_style === style
                            ? 'bg-[#E7770F] text-white'
                            : 'bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] text-white hover:border-[#E7770F]/50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white text-base font-medium mb-3 block">
                    Current Availability
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {AVAILABILITIES.map((avail) => (
                      <button
                        key={avail}
                        type="button"
                        onClick={() => setFormData({ ...formData, availability: avail })}
                        className={`py-3 px-2 text-sm rounded-lg transition-all ${
                          formData.availability === avail
                            ? 'bg-[#E7770F] text-white'
                            : 'bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] text-white hover:border-[#E7770F]/50'
                        }`}
                      >
                        {avail}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 bg-[rgba(255,255,255,0.10)] border-[rgba(103.45,121.38,157.25,0.50)] text-white hover:bg-[rgba(255,255,255,0.15)]"
                >
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.role || formData.skills.length < 3}
                  className="flex-1 bg-[#E7770F] hover:bg-[#d66d0d] text-white disabled:opacity-50"
                >
                  Next →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Launch */}
        {step === 3 && (
          <>
            <OnboardingProgress currentStep={3} totalSteps={3} />

            <MetaFire message="Almost there!<br/>Add a personal touch to your profile." />

            <div className="w-full max-w-xs flex flex-col gap-[50px]">
              <div className="flex flex-col gap-6">
                {/* Creator Tags */}
                <div className="flex flex-col gap-2">
                  <Label className="text-white text-sm leading-[14px]">
                    Creator Tags <span className="text-slate-500 font-normal">(optional)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS_POOL.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleChip('tags', tag)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          formData.tags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] text-slate-300 hover:border-purple-400/50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manifesto */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="manifesto" className="text-white text-sm leading-[14px]">
                    Your Manifesto <span className="text-slate-500 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="manifesto"
                    value={formData.manifesto}
                    onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                    placeholder="I build things that matter..."
                    className="w-full py-4 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                  <p className="text-xs text-slate-500">
                    One sentence about what drives you as a creator
                  </p>
                </div>

                {/* Profile Preview */}
                <div className="bg-[rgba(255,255,255,0.10)] p-6 rounded-xl border border-[rgba(103.45,121.38,157.25,0.50)]">
                  <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide">Profile Summary</p>
                  <div className="space-y-2">
                    <p className="text-white font-semibold text-xl">{formData.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-[#E7770F]/20 rounded-full text-sm font-medium text-[#E7770F]">
                        {formData.role}
                      </span>
                      {formData.city && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">{formData.city}</span>
                        </>
                      )}
                    </div>
                    {formData.school && <p className="text-slate-400">{formData.school}</p>}
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.skills.slice(0, 5).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-[rgba(255,255,255,0.06)] text-slate-300 rounded text-xs">{s}</span>
                        ))}
                        {formData.skills.length > 5 && (
                          <span className="text-slate-500 text-xs">+{formData.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                    {formData.manifesto && (
                      <p className="text-slate-300 italic mt-3 pt-3 border-t border-slate-700">
                        &quot;{formData.manifesto}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Save error */}
                {saveError && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{saveError}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  disabled={saving}
                  className="flex-1 bg-[rgba(255,255,255,0.10)] border-[rgba(103.45,121.38,157.25,0.50)] text-white hover:bg-[rgba(255,255,255,0.15)]"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-[#E7770F] hover:bg-[#d66d0d] text-white font-semibold"
                >
                  {saving ? 'Launching...' : 'Launch Profile 🚀'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

