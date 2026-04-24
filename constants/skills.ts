export type SkillColorKey = 'teal' | 'purple' | 'orange' | 'blue'
export type SkillCategory = 'engineering' | 'design' | 'business' | 'research'

export type SkillDef = {
  name: string
  category: SkillCategory
  color: SkillColorKey
}

// Single source of truth for skill strings used across the app.
// Keep `name` stable; use `SKILL_ALIASES` to map legacy spellings to canonical names.
export const SKILL_CATEGORIES: SkillDef[] = [
  // engineering
  { name: 'Full-Stack', category: 'engineering', color: 'teal' },
  { name: 'Backend', category: 'engineering', color: 'teal' },
  { name: 'Frontend', category: 'engineering', color: 'teal' },
  { name: 'Mobile Dev', category: 'engineering', color: 'teal' },
  { name: 'DevOps', category: 'engineering', color: 'teal' },
  { name: 'AI / ML', category: 'engineering', color: 'teal' },
  { name: 'Data Science', category: 'engineering', color: 'teal' },
  { name: 'Web Dev', category: 'engineering', color: 'teal' },
  { name: 'iOS', category: 'engineering', color: 'teal' },
  { name: 'Android', category: 'engineering', color: 'teal' },
  { name: 'JavaScript', category: 'engineering', color: 'teal' },
  { name: 'Python', category: 'engineering', color: 'teal' },
  { name: 'React', category: 'engineering', color: 'teal' },

  // design
  { name: 'UI Design', category: 'design', color: 'purple' },
  { name: 'UX Design', category: 'design', color: 'purple' },
  { name: 'Figma', category: 'design', color: 'purple' },
  { name: 'Product Design', category: 'design', color: 'purple' },
  { name: 'Brand Identity', category: 'design', color: 'purple' },
  { name: 'Illustration', category: 'design', color: 'purple' },
  { name: 'Motion Design', category: 'design', color: 'purple' },

  // business
  { name: 'Go-to-Market', category: 'business', color: 'orange' },
  { name: 'Growth', category: 'business', color: 'orange' },
  { name: 'Marketing', category: 'business', color: 'orange' },
  { name: 'Business Dev', category: 'business', color: 'orange' },
  { name: 'Strategy', category: 'business', color: 'orange' },
  { name: 'Operations', category: 'business', color: 'orange' },
  { name: 'Finance', category: 'business', color: 'orange' },
  { name: 'Sales', category: 'business', color: 'orange' },

  // research
  { name: 'Research', category: 'research', color: 'blue' },
  { name: 'User Research', category: 'research', color: 'blue' },
  { name: 'Data Analysis', category: 'research', color: 'blue' },
  { name: 'Writing', category: 'research', color: 'blue' },
  { name: 'Content', category: 'research', color: 'blue' },
]

export const SKILLS = SKILL_CATEGORIES.map((s) => s.name)

// Legacy / variant strings that appear in older UI or seed data.
export const SKILL_ALIASES: Record<string, string> = {
  'full-stack dev': 'Full-Stack',
  'full stack': 'Full-Stack',
  'cloud/devops': 'DevOps',
  'ui/ux design': 'UI Design',
  'machine learning': 'AI / ML',
}

export function normalizeSkill(input: string): string {
  const raw = input.trim()
  if (!raw) return ''
  const key = raw.toLowerCase()
  return SKILL_ALIASES[key] ?? raw
}

export function skillColorClass(skillName: string): SkillColorKey {
  const normalized = normalizeSkill(skillName)
  return SKILL_CATEGORIES.find((s) => s.name === normalized)?.color ?? 'teal'
}

