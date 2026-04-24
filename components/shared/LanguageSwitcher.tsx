'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

type LanguageSwitcherProps = {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, tr } = useLocale()
  return (
    <div className={`inline-flex items-center rounded-full border border-white/15 bg-black/20 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => void setLocale('en')}
        className={`rounded-full px-2 py-1 text-xs transition-colors ${
          locale === 'en' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
        }`}
        aria-label="Switch to English"
      >
        {tr('common.languageEn')}
      </button>
      <button
        type="button"
        onClick={() => void setLocale('zh')}
        className={`rounded-full px-2 py-1 text-xs transition-colors ${
          locale === 'zh' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
        }`}
        aria-label="切换到中文"
      >
        {tr('common.languageZh')}
      </button>
    </div>
  )
}
