import { NextRequest, NextResponse } from 'next/server'
import { deepseekChatJson } from '@/lib/deepseek'
import { isAppLocale, type AppLocale } from '@/lib/i18n'

type TranslateBody = {
  texts?: string[]
  targetLocale?: AppLocale
}

function normalizeTexts(texts: string[] = []): string[] {
  return texts
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, 5)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TranslateBody
    const targetLocale = isAppLocale(body.targetLocale) ? body.targetLocale : 'en'
    const texts = normalizeTexts(body.texts ?? [])

    if (texts.length === 0) {
      return NextResponse.json({ texts: [] })
    }

    const sourceLocale = targetLocale === 'zh' ? 'English' : 'Chinese'
    const targetLanguage = targetLocale === 'zh' ? 'Chinese (Simplified)' : 'English'

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const result = (await deepseekChatJson({
        system: 'You are a translation engine. Return strict JSON only.',
        user: `Translate each input sentence from ${sourceLocale} to ${targetLanguage}.
Keep tone and brevity.
Return JSON: {"texts": ["..."]} with the same array length and order.
Input texts:
${JSON.stringify(texts)}`,
        signal: controller.signal,
        temperature: 0.2,
        maxTokens: 300,
      })) as { texts?: string[] }

      clearTimeout(timeout)

      const translated = Array.isArray(result.texts) ? result.texts.slice(0, texts.length) : []
      if (translated.length !== texts.length) {
        return NextResponse.json({ texts })
      }
      return NextResponse.json({ texts: translated })
    } catch {
      clearTimeout(timeout)
      return NextResponse.json({ texts })
    }
  } catch {
    return NextResponse.json({ texts: [] }, { status: 400 })
  }
}
