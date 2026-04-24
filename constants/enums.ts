import { Availability } from '@/types/interfaces/Enums'
import { SKILLS } from '@/constants/skills'

/**
 * Enum value constants for forms and displays
 * These match the database check constraints exactly.
 *
 * Database constraints checked: 2026-03-08
 * - availability: 'weekends', 'evenings', 'flexible', 'full-time'
 * - collab_style: no constraint (free text)
 * - role: 'Visionary', 'Builder', 'Strategist', 'Connector'
 * - hackathon_track: 'Engineering', 'Design', 'Business', 'Science', 'Social Impact'
 *
 * TODO: In the future, fetch these from database enum tables.
 */

export const COLLAB_STYLES = [
  'Sprint-focused',
  'Marathon-minded',
  'Flexible',
] as const

export const AVAILABILITIES: Availability[] = [
  'full-time',
  'evenings',
  'weekends',
  'flexible',
]

// Skills pool — deprecated. Use SKILLS from `constants/skills.ts`.
// Kept as an alias so legacy imports keep working.
export const SKILLS_POOL = SKILLS

// Interests pool — sourced from MetaCreate_Prototype.jsx
export const INTERESTS_POOL = [
  'Space Exploration', 'AI & Ethics', 'Climate Tech', 'Education', 'Healthcare',
  'Future Cities', 'Digital Art', 'Social Impact', 'Gaming', 'Biotech',
  'Quantum Computing', 'Neuroscience', 'Philosophy', 'Entrepreneurship', 'Music',
  'Film & Media', 'Architecture', 'Food Tech', 'Fashion Tech', 'Web3',
] as const

// Suggested creator tags — used as onboarding tag suggestions
export const TAGS_POOL = [
  'Systems Thinker', 'Creative Catalyst', 'Data Whisperer', 'Future Architect',
  'Bridge Builder', 'Rapid Prototyper', 'Story Weaver', 'Pattern Finder',
  'Community Spark', 'Technical Poet', 'Design Philosopher', 'Code Artisan',
  'Impact Driver', 'Curiosity Engine', 'Boundary Crosser', 'Moonshot Dreamer',
  'Empathy Navigator', 'Logic Sculptor', 'Chaos Organizer', 'Vision Translator',
] as const
