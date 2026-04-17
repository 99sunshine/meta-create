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
import { AVAILABILITIES, SKILLS_POOL, INTERESTS_POOL } from '@/constants/enums'
import type { Role } from '@/types/interfaces/Role'
import type { Availability } from '@/types/interfaces/Enums'
import {
  MetaFire,
  OnboardingProgress,
  ResumeUpload,
  AuthBackground,
} from '@/components/features/onboarding'

const HACKATHON_TRACKS = [
  'AI & Machine Learning',
  'Web3 & DeFi',
  'Climate Tech',
  'HealthTech',
  'EdTech',
  'Gaming & Metaverse',
  'Creator Economy',
  'Social Impact',
  'Open Track',
]

type Step = 1 | 2

export default function OnboardingPage() {
  const { sessionUser, loading, refreshProfile } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    city: '',
    school: '',
    hackathon_track: '',
    resume: null as File | null,
    // Step 2
    role: '' as Role | '',
    skills: [] as string[],
    interests: [] as string[],
    availability: '' as Availability | '',
    // Generated
    tags: [] as string[],
    manifesto: '',
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.push('/login')
    }
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (sessionUser?.email) {
      setFormData((prev) => ({ ...prev, email: sessionUser.email || '' }))
    }
  }, [sessionUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121B3E]">
        <p className="text-white">Loading...</p>
      </div>
    )
  }
  if (!sessionUser) return null

  const toggleChip = (field: 'skills' | 'interests' | 'tags', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }))
  }

  const handleGenerateTags = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formData.role,
          skills: formData.skills,
          interests: formData.interests,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        const data = await res.json() as { tags?: string[]; manifesto?: string }
        if (data.tags?.length) {
          setFormData((prev) => ({
            ...prev,
            tags: data.tags ?? prev.tags,
            manifesto: data.manifesto && !prev.manifesto ? data.manifesto : prev.manifesto,
          }))
          setAiGenerated(true)
        }
      }
    } catch {
      // Silently fall through — user can enter manually
    } finally {
      setAiLoading(false)
    }
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
        hackathon_track: formData.hackathon_track || null,
        role: formData.role as Role,
        skills: formData.skills.length > 0 ? formData.skills : null,
        interests: formData.interests.length > 0 ? formData.interests : null,
        availability: (formData.availability as Availability) || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        manifesto: formData.manifesto || null,
        onboarding_complete: true,
      })
      await refreshProfile()
      trackEvent('onboarding_completed', {
        role: formData.role,
        skills_count: formData.skills.length,
        ai_tags: aiGenerated,
      })
      router.push('/explore')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  // ── Step 1: Basic Info + Track ──────────────────────────────────────────────
  const step1Valid = !!formData.name && !!formData.city && !!formData.school
  // ── Step 2: Role + Skills ───────────────────────────────────────────────────
  const step2Valid = !!formData.role && formData.skills.length >= 3

  return (
    <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-sm flex flex-col items-center gap-5 relative z-10">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <OnboardingProgress currentStep={1} totalSteps={2} />
            <MetaFire message="Welcome to MetaCreate!<br/>Let's set up your creator profile." />

            <div className="w-full max-w-xs flex flex-col gap-8">
              {/* Resume upload (optional) */}
              <ResumeUpload
                onFileSelect={(file) => setFormData({ ...formData, resume: file })}
                selectedFile={formData.resume}
              />

              <div className="flex flex-col gap-5">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-white text-sm">Display Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="How should others see you?"
                    className="w-full py-4 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                {/* School */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="school" className="text-white text-sm">School / Organisation *</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder="e.g. Tsinghua, MIT…"
                    className="w-full py-4 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                {/* City */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city" className="text-white text-sm">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Beijing, Shanghai, New York…"
                    className="w-full py-4 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                {/* Hackathon Track */}
                <div className="flex flex-col gap-2">
                  <Label className="text-white text-sm">
                    Hackathon Track <span className="text-white/40 font-normal text-xs">(optional)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {HACKATHON_TRACKS.map((track) => (
                      <button
                        key={track}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, hackathon_track: formData.hackathon_track === track ? '' : track })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          formData.hackathon_track === track
                            ? 'bg-[#E7770F] text-white'
                            : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-slate-300 hover:border-[#E7770F]/50'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-56 mx-auto py-4 bg-[#E7770F] hover:bg-[#d66d0d] rounded-full text-white text-base font-medium h-auto disabled:opacity-50"
              >
                Next →
              </Button>

              <button
                type="button"
                className="text-xs text-white/30 hover:text-white/50 mx-auto"
                onClick={() => router.push('/explore')}
              >
                I&apos;ll set this up later
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Role + Skills + AI Tags ── */}
        {step === 2 && (
          <>
            <OnboardingProgress currentStep={2} totalSteps={2} />
            <MetaFire message="Now... what are your superpowers?<br/>Pick at least 3 skills so we can match you." />

            <div className="w-full max-w-xs flex flex-col gap-8">
              {/* Role */}
              <div>
                <Label className="text-white text-base font-medium mb-4 block">Your Role *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    return (
                      <button
                        key={role.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.name })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.role === role.name
                            ? 'border-[#E7770F] bg-[#E7770F]/20'
                            : 'border-[rgba(103,121,157,0.5)] bg-white/10 hover:border-[#E7770F]/50'
                        }`}
                      >
                        <Icon className={`w-7 h-7 mb-2 ${formData.role === role.name ? 'text-[#E7770F]' : 'text-slate-400'}`} />
                        <div className="font-semibold text-white text-sm">{role.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{role.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label className="text-white text-base font-medium mb-3 block">
                  Skills * <span className="text-slate-400 font-normal text-sm">(select at least 3)</span>
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
                          : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-slate-300 hover:border-[#E7770F]/50'
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

              {/* Interests */}
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
                          : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-slate-300 hover:border-indigo-400/50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <Label className="text-white text-base font-medium mb-3 block">Availability</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABILITIES.map((avail) => (
                    <button
                      key={avail}
                      type="button"
                      onClick={() => setFormData({ ...formData, availability: avail })}
                      className={`py-2.5 px-2 text-xs rounded-lg transition-all ${
                        formData.availability === avail
                          ? 'bg-[#E7770F] text-white'
                          : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-white hover:border-[#E7770F]/50'
                      }`}
                    >
                      {avail}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Tags section */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">✦ Creator Tags</p>
                    <p className="text-xs text-white/40 mt-0.5">AI-generated personality tags</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateTags}
                    disabled={aiLoading || formData.skills.length < 1}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#E7770F]/20 border border-[#E7770F]/40 text-[#E7770F] hover:bg-[#E7770F]/30 disabled:opacity-40 transition-all"
                  >
                    {aiLoading ? 'Generating…' : aiGenerated ? '↺ Regenerate' : '✦ Generate'}
                  </button>
                </div>

                {formData.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs bg-purple-500/20 border border-purple-500/40 text-purple-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/30">
                    {formData.skills.length < 1
                      ? 'Select at least 1 skill above first'
                      : 'Click "Generate" to get AI-suggested tags'}
                  </p>
                )}
              </div>

              {/* Manifesto */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="manifesto" className="text-white text-sm">
                  Your Manifesto <span className="text-slate-500 font-normal">(optional)</span>
                </Label>
                <textarea
                  id="manifesto"
                  value={formData.manifesto}
                  onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                  rows={2}
                  placeholder={aiGenerated ? 'AI-suggested above — edit freely' : 'I build things that matter...'}
                  className="w-full py-3 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm resize-none focus:border-[#E7770F] focus:outline-none"
                />
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{saveError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  disabled={saving}
                  className="flex-1 bg-white/10 border-[rgba(103,121,157,0.5)] text-white hover:bg-white/15"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!step2Valid || saving}
                  className="flex-1 bg-[#E7770F] hover:bg-[#d66d0d] text-white font-semibold disabled:opacity-50"
                >
                  {saving ? 'Launching…' : 'Launch Profile 🚀'}
                </Button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
