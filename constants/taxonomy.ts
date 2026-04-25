import type { AppLocale } from '@/lib/i18n'

export type LocalizedOption = {
  value: string
  en: string
  zh: string
}

export const HACKATHON_TRACK_OPTIONS: LocalizedOption[] = [
  { value: 'AI & Machine Learning', en: 'AI & Machine Learning', zh: '人工智能与机器学习' },
  { value: 'Web3 & DeFi', en: 'Web3 & DeFi', zh: 'Web3 与去中心化金融' },
  { value: 'Climate Tech', en: 'Climate Tech', zh: '气候科技' },
  { value: 'HealthTech', en: 'HealthTech', zh: '医疗健康科技' },
  { value: 'EdTech', en: 'EdTech', zh: '教育科技' },
  { value: 'Gaming & Metaverse', en: 'Gaming & Metaverse', zh: '游戏与元宇宙' },
  { value: 'Creator Economy', en: 'Creator Economy', zh: '创作者经济' },
  { value: 'Social Impact', en: 'Social Impact', zh: '社会影响力' },
  { value: 'Open Track', en: 'Open Track', zh: '开放赛道' },
]

export const INTEREST_OPTIONS: LocalizedOption[] = [
  { value: 'Space Exploration', en: 'Space Exploration', zh: '太空探索' },
  { value: 'AI & Ethics', en: 'AI & Ethics', zh: '人工智能与伦理' },
  { value: 'Climate Tech', en: 'Climate Tech', zh: '气候科技' },
  { value: 'Education', en: 'Education', zh: '教育' },
  { value: 'Healthcare', en: 'Healthcare', zh: '医疗健康' },
  { value: 'Future Cities', en: 'Future Cities', zh: '未来城市' },
  { value: 'Digital Art', en: 'Digital Art', zh: '数字艺术' },
  { value: 'Social Impact', en: 'Social Impact', zh: '社会影响力' },
  { value: 'Gaming', en: 'Gaming', zh: '游戏' },
  { value: 'Biotech', en: 'Biotech', zh: '生物科技' },
  { value: 'Quantum Computing', en: 'Quantum Computing', zh: '量子计算' },
  { value: 'Neuroscience', en: 'Neuroscience', zh: '神经科学' },
  { value: 'Philosophy', en: 'Philosophy', zh: '哲学' },
  { value: 'Entrepreneurship', en: 'Entrepreneurship', zh: '创业' },
  { value: 'Music', en: 'Music', zh: '音乐' },
  { value: 'Film & Media', en: 'Film & Media', zh: '影视与媒体' },
  { value: 'Architecture', en: 'Architecture', zh: '建筑' },
  { value: 'Food Tech', en: 'Food Tech', zh: '食品科技' },
  { value: 'Fashion Tech', en: 'Fashion Tech', zh: '时尚科技' },
  { value: 'Web3', en: 'Web3', zh: 'Web3' },
]

export const HACKATHON_TRACK_VALUES = HACKATHON_TRACK_OPTIONS.map((item) => item.value)
export const INTEREST_VALUES = INTEREST_OPTIONS.map((item) => item.value)

const trackLabelMap = new Map(HACKATHON_TRACK_OPTIONS.map((item) => [item.value, item]))
const interestLabelMap = new Map(INTEREST_OPTIONS.map((item) => [item.value, item]))

function pickLocaleLabel(option: LocalizedOption, locale: AppLocale): string {
  return locale === 'zh' ? option.zh : option.en
}

export function getLocalizedTrackLabel(value: string, locale: AppLocale): string {
  const option = trackLabelMap.get(value)
  return option ? pickLocaleLabel(option, locale) : value
}

export function getLocalizedInterestLabel(value: string, locale: AppLocale): string {
  const option = interestLabelMap.get(value)
  return option ? pickLocaleLabel(option, locale) : value
}
