import { Availability } from '@/types/interfaces/Enums'

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
