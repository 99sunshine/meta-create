'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AppLocale } from '@/lib/i18n'
import { localizeManifestoText, localizeSkill, localizeTag, looksChinese } from '@/lib/localized-content'

const cache = new Map<string, string>()

function cacheKey(locale: AppLocale, text: string): string {
  return `${locale}::${text}`
}

export function useLocalizedTags(tags: string[], locale: AppLocale): string[] {
  const prelocalized = useMemo(() => tags.map((tag) => localizeTag(tag, locale)), [locale, tags])
  const [translations, setTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    const source = tags.map((tag) => tag.trim()).filter(Boolean)
    if (source.length === 0) return

    const unresolved = source.filter((tag, idx) => {
      if (prelocalized[idx] !== tag) return false
      if (translations[tag]) return false
      const isZhText = looksChinese(tag)
      return (locale === 'zh' && !isZhText) || (locale === 'en' && isZhText)
    })
    if (unresolved.length === 0) return

    const cached: Record<string, string> = {}
    const needFetch: string[] = []
    for (const text of unresolved) {
      const hit = cache.get(cacheKey(locale, text))
      if (hit) cached[text] = hit
      else needFetch.push(text)
    }

    if (Object.keys(cached).length > 0) {
      setTranslations((prev) => ({ ...prev, ...cached }))
    }
    if (needFetch.length === 0) return

    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: needFetch, targetLocale: locale }),
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { texts?: string[] }
        const translated = Array.isArray(data.texts) ? data.texts : []
        const fetchedMap: Record<string, string> = {}
        for (let i = 0; i < needFetch.length; i += 1) {
          const raw = needFetch[i]
          const next = translated[i]?.trim()
          if (!next) continue
          cache.set(cacheKey(locale, raw), next)
          fetchedMap[raw] = next
        }
        if (Object.keys(fetchedMap).length === 0 || cancelled) return
        setTranslations((prev) => ({ ...prev, ...fetchedMap }))
      } catch {
        // Ignore failed translation request and keep original text.
      }
    }
    void run()

    return () => {
      cancelled = true
    }
  }, [locale, prelocalized, tags, translations])

  return useMemo(
    () => prelocalized.map((item, idx) => translations[tags[idx]?.trim() ?? ''] ?? item),
    [prelocalized, tags, translations],
  )
}

export function useLocalizedSkills(skills: string[], locale: AppLocale): string[] {
  const prelocalized = useMemo(() => skills.map((skill) => localizeSkill(skill, locale)), [locale, skills])
  const [translations, setTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    const source = skills.map((skill) => skill.trim()).filter(Boolean)
    if (source.length === 0) return

    const unresolved = source.filter((skill, idx) => {
      if (prelocalized[idx] !== skill) return false
      if (translations[skill]) return false
      const isZhText = looksChinese(skill)
      return (locale === 'zh' && !isZhText) || (locale === 'en' && isZhText)
    })
    if (unresolved.length === 0) return

    const cached: Record<string, string> = {}
    const needFetch: string[] = []
    for (const text of unresolved) {
      const hit = cache.get(cacheKey(locale, text))
      if (hit) cached[text] = hit
      else needFetch.push(text)
    }

    if (Object.keys(cached).length > 0) {
      setTranslations((prev) => ({ ...prev, ...cached }))
    }
    if (needFetch.length === 0) return

    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: needFetch, targetLocale: locale }),
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { texts?: string[] }
        const translated = Array.isArray(data.texts) ? data.texts : []
        const fetchedMap: Record<string, string> = {}
        for (let i = 0; i < needFetch.length; i += 1) {
          const raw = needFetch[i]
          const next = translated[i]?.trim()
          if (!next) continue
          cache.set(cacheKey(locale, raw), next)
          fetchedMap[raw] = next
        }
        if (Object.keys(fetchedMap).length === 0 || cancelled) return
        setTranslations((prev) => ({ ...prev, ...fetchedMap }))
      } catch {
        // Ignore failed translation request and keep original text.
      }
    }
    void run()

    return () => {
      cancelled = true
    }
  }, [locale, prelocalized, skills, translations])

  return useMemo(
    () => prelocalized.map((item, idx) => translations[skills[idx]?.trim() ?? ''] ?? item),
    [prelocalized, skills, translations],
  )
}

export function useLocalizedManifesto(manifesto: string | null | undefined, locale: AppLocale): string {
  const rawText = manifesto?.trim() ?? ''
  const prelocalized = useMemo(() => localizeManifestoText(rawText, locale), [locale, rawText])
  const [localized, setLocalized] = useState(prelocalized)

  useEffect(() => {
    setLocalized(prelocalized)
  }, [prelocalized])

  useEffect(() => {
    if (!rawText) return
    if (prelocalized !== rawText) return

    const isZhText = looksChinese(rawText)
    if ((locale === 'zh' && isZhText) || (locale === 'en' && !isZhText)) return

    const key = cacheKey(locale, rawText)
    const hit = cache.get(key)
    if (hit) {
      setLocalized(hit)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [rawText], targetLocale: locale }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { texts?: string[] }
        const translated = data.texts?.[0]?.trim()
        if (!translated || cancelled) return
        cache.set(key, translated)
        setLocalized(translated)
      } catch {
        // Ignore failed translation request and keep original text.
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [locale, prelocalized, rawText])

  return localized
}
