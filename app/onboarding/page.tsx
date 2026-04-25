'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileRepository } from '@/supabase/repos/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
import { ROLES } from '@/constants/roles'
import { AVAILABILITIES } from '@/constants/enums'
import { SKILLS } from '@/constants/skills'
import { HACKATHON_TRACK_OPTIONS, INTEREST_OPTIONS } from '@/constants/taxonomy'
import type { Role } from '@/types/interfaces/Role'
import type { Availability } from '@/types/interfaces/Enums'
import dynamic from 'next/dynamic'
import { createClient } from '@/supabase/utils/client'
import {
  MetaFire,
  OnboardingProgress,
  AuthBackground,
} from '@/components/features/onboarding'

const ResumeUpload = dynamic(
  () => import('@/components/features/onboarding').then((m) => ({ default: m.ResumeUpload })),
  { ssr: false, loading: () => <div className="h-[72px] rounded-xl bg-white/[0.06] animate-pulse" /> },
)
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useLocalizedSkills } from '@/hooks/useLocalizedText'

type Step = 1 | 2

export default function OnboardingPage() {
  const { sessionUser, loading, refreshProfile } = useAuth()
  const { locale, tr } = useLocale()
  const router = useRouter()
  const localizedSkills = useLocalizedSkills(SKILLS, locale)

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
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumePrefillHint, setResumePrefillHint] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  type ResumeExtracted = { name?: string | null; city?: string | null; skills?: string[]; interests?: string[]; school?: string | null; summary?: string | null }
  const [pendingResume, setPendingResume] = useState<ResumeExtracted | null>(null)
  const pendingResumeRef = useRef<ResumeExtracted | null>(null)

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.push('/login')
    }
  }, [loading, sessionUser, router])

  useEffect(() => {
    const em = sessionUser?.email
    if (em) {
      setFormData((prev) => ({ ...prev, email: em }))
    }
  }, [sessionUser?.email])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [step])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121B3E]">
        <p className="text-white">{tr('common.loading')}</p>
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
          locale,
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

  const applyResumeData = (r: ResumeExtracted) => {
    setFormData((prev) => ({
      ...prev,
      name: r.name || prev.name,
      city: r.city || prev.city,
      school: r.school || prev.school,
      skills: r.skills?.length ? r.skills : prev.skills,
      interests: r.interests?.length ? r.interests : prev.interests,
      manifesto: r.summary || prev.manifesto,
    }))
    setPendingResume(null)
    pendingResumeRef.current = null
    const inferred: string[] = []
    if (r.name) inferred.push(tr('onboarding.inferredName') ?? '姓名')
    if (r.city) inferred.push(tr('onboarding.inferredCity') ?? '城市')
    if (inferred.length > 0) setResumePrefillHint(tr('onboarding.inferred', { fields: inferred.join('、') }))
  }

  const handleResumeSelect = async (file: File | null) => {
    setFormData((prev) => ({ ...prev, resume: file }))
    setResumePrefillHint(null)
    if (!file) return
    setResumeLoading(true)
    try {
      const supabase = createClient()
      const ext = file.name.toLowerCase().endsWith('.pdf') ? 'pdf'
        : file.name.toLowerCase().endsWith('.docx') ? 'docx'
          : ''
      if (!ext) {
        setResumePrefillHint(tr('onboarding.unsupportedResume'))
        return
      }

      // Upload to private bucket first, so server can sign URL and invoke OCR-capable parsers.
      const path = `${sessionUser.id}/${crypto.randomUUID()}-${file.name}`.slice(0, 180)
      const { error: upErr } = await supabase.storage
        .from('resumes')
        .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' })
      if (upErr) {
        setResumePrefillHint(tr('onboarding.uploadFailed'))
        return
      }

      // Remote parse (DashScope document parse + DeepSeek structuring).
      const res = await fetch('/api/ai/parse-resume-remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'resumes', filePath: path }),
      })
      const data = await res.json().catch(() => ({})) as {
        source?: string
        error?: string
        result?: { name?: string | null; city?: string | null; skills?: string[]; interests?: string[]; school?: string | null; summary?: string | null }
      }
      if (!res.ok) {
        setResumePrefillHint(data?.error ? `${tr('onboarding.parseFailed')}：${data.error}` : tr('onboarding.parseFailed'))
        return
      }
      const r = data.result
      if (!r) {
        setResumePrefillHint(tr('onboarding.parseEmpty'))
        return
      }
      // Check if any existing fields would be overwritten
      const hasExisting = !!(formData.name || formData.city || formData.school || formData.skills.length || formData.interests.length || formData.manifesto)
      if (hasExisting) {
        // Show confirmation dialog instead of silently prefilling
        pendingResumeRef.current = r
        setPendingResume(r)
        setResumePrefillHint(tr('onboarding.resumeExtracted'))
        return
      }
      // No existing data — silently prefill
      applyResumeData(r)
    } finally {
      setResumeLoading(false)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? tr('onboarding.saveFailed'))
      }
      const profileRefreshOk = await refreshProfile()
      if (!profileRefreshOk) {
        throw new Error(tr('onboarding.refreshAfterSaveFailed'))
      }
      trackEvent('onboarding_completed', {
        role: formData.role,
        skills_count: formData.skills.length,
        ai_tags: aiGenerated,
      })
      router.push('/explore')
      router.refresh()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : tr('onboarding.saveFailed'))
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
      <LanguageSwitcher className="absolute right-4 top-4 z-20" />

      <div className="w-full max-w-sm flex flex-col items-center gap-5 relative z-10">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <OnboardingProgress currentStep={1} totalSteps={2} />
            <MetaFire message={tr('onboarding.welcome')} />

            <div className="w-full max-w-xs flex flex-col gap-8">
              {/* Resume upload (optional) */}
              <ResumeUpload
                onFileSelect={handleResumeSelect}
                selectedFile={formData.resume}
              />
              {resumeLoading && (
                <p className="text-[12px] text-white/60 text-center -mt-4">{tr('onboarding.parsingResume')}</p>
              )}
              {resumePrefillHint && !resumeLoading && (
                <div className="-mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center">
                  <p className="text-[12px] text-amber-200">{resumePrefillHint}</p>
                </div>
              )}

              {/* Resume overwrite confirmation dialog */}
              {pendingResume && (
                <div
                  className="fixed inset-0 z-50 flex items-end justify-center p-4"
                  style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                >
                  <div className="w-full max-w-md rounded-3xl border border-white/10 p-5 mb-2 space-y-4" style={{ backgroundColor: '#101837' }}>
                    <p className="text-base font-semibold text-white">{tr('onboarding.overwriteResumeTitle')}</p>
                    <p className="text-[13px] text-white/60 leading-relaxed">
                      {tr('onboarding.overwriteResumeDesc')}
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-sm text-white/70"
                        onClick={() => { setPendingResume(null); pendingResumeRef.current = null; setResumePrefillHint(null) }}
                      >
                        {tr('onboarding.keepCurrent')}
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: '#E7770F' }}
                        onClick={() => applyResumeData(pendingResume)}
                      >
                        {tr('onboarding.overwriteWithResume')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-5">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-white text-sm">{tr('onboarding.displayName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={tr('onboarding.displayNamePlaceholder')}
                    className="w-full py-4 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                {/* School */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="school" className="text-white text-sm">{tr('onboarding.school')}</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder={tr('onboarding.schoolPlaceholder')}
                    className="w-full py-4 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                {/* City */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city" className="text-white text-sm">{tr('onboarding.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={tr('onboarding.cityPlaceholder')}
                    className="w-full py-4 px-4 bg-white/10 border border-[rgba(103,121,157,0.5)] rounded-lg text-white placeholder:text-[#BFBFBF] text-sm h-auto"
                  />
                </div>

                {/* Hackathon Track */}
                <div className="flex flex-col gap-2">
                  <Label className="text-white text-sm">
                    {tr('onboarding.track')} <span className="text-white/40 font-normal text-xs">{tr('onboarding.optional')}</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {HACKATHON_TRACK_OPTIONS.map((track) => {
                      const label = locale === 'zh' ? track.zh : track.en
                      return (
                        <button
                          key={track.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              hackathon_track: formData.hackathon_track === track.value ? '' : track.value,
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                            formData.hackathon_track === track.value
                              ? 'bg-[#E7770F] text-white'
                              : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-slate-300 hover:border-[#E7770F]/50'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="w-56 mx-auto py-4 bg-[#E7770F] hover:bg-[#d66d0d] rounded-xl text-white text-base font-medium h-auto disabled:opacity-50"
              >
                {tr('onboarding.next')}
              </Button>

              <button
                type="button"
                className="text-xs text-white/30 hover:text-white/50 mx-auto"
                onClick={() => router.push('/explore')}
              >
                {tr('onboarding.setupLater')}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Role + Skills + AI Tags ── */}
        {step === 2 && (
          <>
            <OnboardingProgress currentStep={2} totalSteps={2} />
            <MetaFire message={tr('onboarding.superpowers')} />

            <div className="w-full max-w-xs flex flex-col gap-8">
              {/* Role */}
              <div>
                <Label className="text-white text-base font-medium mb-4 block">{tr('onboarding.yourRole')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((role) => {
                    const Icon = role.icon
                    return (
                      <button
                        key={role.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.name })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.role === role.name
                            ? 'border-[#E7770F] bg-[#E7770F]/20'
                            : 'border-[rgba(103,121,157,0.5)] bg-white/10 hover:border-[#E7770F]/50'
                        }`}
                      >
                        <Icon className={`w-7 h-7 mb-2 ${formData.role === role.name ? 'text-[#E7770F]' : 'text-slate-400'}`} />
                        <div className="font-semibold text-white text-sm">{tr(`roles.${String(role.name).toLowerCase()}`)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{tr(`onboarding.role${role.name}Desc`)}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label className="text-white text-base font-medium mb-3 block">
                  {tr('onboarding.skills')} <span className="text-slate-400 font-normal text-sm">{tr('onboarding.selectAtLeast3')}</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill, idx) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleChip('skills', skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                        formData.skills.includes(skill)
                          ? 'bg-[#E7770F] text-white'
                          : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-slate-300 hover:border-[#E7770F]/50'
                      }`}
                    >
                      {localizedSkills[idx] ?? skill}
                    </button>
                  ))}
                </div>
                {formData.skills.length > 0 && (
                  <p className="text-xs text-[#E7770F] mt-2">{tr('onboarding.selectedCount', { count: formData.skills.length })}</p>
                )}
              </div>

              {/* Interests */}
              <div>
                <Label className="text-white text-base font-medium mb-3 block">
                  {tr('onboarding.interests')} <span className="text-slate-400 font-normal text-sm">{tr('onboarding.optional')}</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => {
                    const label = locale === 'zh' ? interest.zh : interest.en
                    return (
                      <button
                        key={interest.value}
                        type="button"
                        onClick={() => toggleChip('interests', interest.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                          formData.interests.includes(interest.value)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/10 border border-[rgba(103,121,157,0.5)] text-slate-300 hover:border-indigo-400/50'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Availability */}
              <div>
                <Label className="text-white text-base font-medium mb-3 block">{tr('onboarding.availability')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABILITIES.map((avail) => (
                    <button
                      key={avail}
                      type="button"
                      onClick={() => setFormData({ ...formData, availability: avail })}
                      className={`py-2.5 px-2 text-xs rounded-xl transition-all ${
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
                    <p className="text-sm font-semibold text-white">{tr('onboarding.creatorTags')}</p>
                    <p className="text-xs text-white/40 mt-0.5">{tr('onboarding.aiTagsHint')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateTags}
                    disabled={aiLoading || formData.skills.length < 1}
                    className="text-xs px-3 py-1.5 rounded-xl bg-[#E7770F]/20 border border-[#E7770F]/40 text-[#E7770F] hover:bg-[#E7770F]/30 disabled:opacity-40 transition-all"
                  >
                    {aiLoading ? tr('onboarding.generating') : aiGenerated ? tr('onboarding.regenerate') : tr('onboarding.generate')}
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
                      ? tr('onboarding.selectOneSkillFirst')
                      : tr('onboarding.clickGenerate')}
                  </p>
                )}
              </div>

              {/* Manifesto */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="manifesto" className="text-white text-sm">
                  {tr('onboarding.manifesto')} <span className="text-slate-500 font-normal">{tr('onboarding.optional')}</span>
                </Label>
                <textarea
                  id="manifesto"
                  value={formData.manifesto}
                  onChange={(e) => setFormData({ ...formData, manifesto: e.target.value })}
                  rows={2}
                  placeholder={aiGenerated ? tr('onboarding.manifestoPlaceholderAi') : tr('onboarding.manifestoPlaceholder')}
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
                  {tr('onboarding.backArrow')}
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!step2Valid}
                  loading={saving}
                  loadingText={tr('onboarding.loadingText')}
                  className="flex-1 bg-[#E7770F] hover:bg-[#d66d0d] text-white font-semibold disabled:opacity-50"
                >
                  {tr('onboarding.launch')}
                </Button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
