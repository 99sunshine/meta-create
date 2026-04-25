import type { AppLocale } from '@/lib/i18n'

const TAG_TRANSLATIONS: Record<string, { en: string; zh: string }> = {
  'Deep Builder': { en: 'Deep Builder', zh: '深度建造者' },
  'AI-Native': { en: 'AI-Native', zh: 'AI 原生派' },
  'First-Principles Thinker': { en: 'First-Principles Thinker', zh: '第一性原理思考者' },
  'Community Catalyst': { en: 'Community Catalyst', zh: '社区催化者' },
  'Systems Thinker': { en: 'Systems Thinker', zh: '系统思考者' },
  'Design-Driven': { en: 'Design-Driven', zh: '设计驱动者' },
  'Growth Hacker': { en: 'Growth Hacker', zh: '增长黑客' },
  'Rapid Prototyper': { en: 'Rapid Prototyper', zh: '快速原型实践者' },
  'Cross-Disciplinary': { en: 'Cross-Disciplinary', zh: '跨学科协作者' },
}

const MANIFESTO_TRANSLATIONS: Record<string, { en: string; zh: string }> = {
  'Building products that solve real problems, one commit at a time.': {
    en: 'Building products that solve real problems, one commit at a time.',
    zh: '一次一次提交代码，打造真正解决问题的产品。',
  },
  'Turning ambitious ideas into movements that reshape the world.': {
    en: 'Turning ambitious ideas into movements that reshape the world.',
    zh: '把宏大想法变成能改变世界的行动。',
  },
  'Bridging brilliant people to create something none could build alone.': {
    en: 'Bridging brilliant people to create something none could build alone.',
    zh: '连接优秀的人，一起创造任何人都无法独自完成的作品。',
  },
  'Turning complex challenges into clear paths to impact.': {
    en: 'Turning complex challenges into clear paths to impact.',
    zh: '把复杂挑战转化为清晰可执行的影响路径。',
  },
  'Crafting experiences that feel inevitable in hindsight.': {
    en: 'Crafting experiences that feel inevitable in hindsight.',
    zh: '打造让人回看时觉得理所当然的体验。',
  },
  'Creating at the intersection of ideas, technology, and community.': {
    en: 'Creating at the intersection of ideas, technology, and community.',
    zh: '在创意、技术与社群的交汇处创造价值。',
  },
}

const SKILL_TRANSLATIONS: Record<string, { en: string; zh: string }> = {
  'Full-Stack': { en: 'Full-Stack', zh: '全栈开发' },
  Backend: { en: 'Backend', zh: '后端开发' },
  Frontend: { en: 'Frontend', zh: '前端开发' },
  'Mobile Dev': { en: 'Mobile Dev', zh: '移动开发' },
  DevOps: { en: 'DevOps', zh: '运维开发' },
  'AI / ML': { en: 'AI / ML', zh: '人工智能 / 机器学习' },
  'Data Science': { en: 'Data Science', zh: '数据科学' },
  'Web Dev': { en: 'Web Dev', zh: '网页开发' },
  iOS: { en: 'iOS', zh: 'iOS 开发' },
  Android: { en: 'Android', zh: 'Android 开发' },
  JavaScript: { en: 'JavaScript', zh: 'JavaScript' },
  Python: { en: 'Python', zh: 'Python' },
  React: { en: 'React', zh: 'React' },
  'UI Design': { en: 'UI Design', zh: '界面设计' },
  'UX Design': { en: 'UX Design', zh: '用户体验设计' },
  Figma: { en: 'Figma', zh: 'Figma' },
  'Product Design': { en: 'Product Design', zh: '产品设计' },
  'Brand Identity': { en: 'Brand Identity', zh: '品牌识别' },
  Illustration: { en: 'Illustration', zh: '插画' },
  'Motion Design': { en: 'Motion Design', zh: '动效设计' },
  'Go-to-Market': { en: 'Go-to-Market', zh: '市场进入策略' },
  Growth: { en: 'Growth', zh: '增长' },
  Marketing: { en: 'Marketing', zh: '市场营销' },
  'Business Dev': { en: 'Business Dev', zh: '商务拓展' },
  Strategy: { en: 'Strategy', zh: '战略' },
  Operations: { en: 'Operations', zh: '运营' },
  Finance: { en: 'Finance', zh: '金融' },
  Sales: { en: 'Sales', zh: '销售' },
  Research: { en: 'Research', zh: '研究' },
  'User Research': { en: 'User Research', zh: '用户研究' },
  'Data Analysis': { en: 'Data Analysis', zh: '数据分析' },
  Writing: { en: 'Writing', zh: '写作' },
  Content: { en: 'Content', zh: '内容创作' },
}

export function looksChinese(text: string): boolean {
  return /[\u3400-\u9FFF]/.test(text)
}

function byLocale(value: { en: string; zh: string }, locale: AppLocale): string {
  return locale === 'zh' ? value.zh : value.en
}

export function localizeTag(tag: string, locale: AppLocale): string {
  const known = TAG_TRANSLATIONS[tag]
  if (known) return byLocale(known, locale)
  return tag
}

export function localizeManifestoText(text: string, locale: AppLocale): string {
  const known = MANIFESTO_TRANSLATIONS[text]
  if (known) return byLocale(known, locale)
  return text
}

export function localizeSkill(skill: string, locale: AppLocale): string {
  const known = SKILL_TRANSLATIONS[skill]
  if (known) return byLocale(known, locale)
  return skill
}
