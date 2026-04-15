/**
 * Weighted matching algorithm for MetaCreate co-creator discovery.
 *
 * Design principles:
 * - Pure functions only — no side-effects, no DB calls. Testable in isolation.
 * - Transparent scoring: every returned MatchResult includes human-readable reasons.
 * - No ML / vector DB. Deterministic, auditable, easy to tune.
 *
 * Score range: 0–100. Weights defined in WEIGHTS constant.
 */

import type { UserProfile } from '@/types'
import type { TeamWithMembers } from '@/types'
import type { WorkWithCreator } from '@/types'
import { ROLE_COMPLEMENTARITY } from '@/types/interfaces/Role'
import type { Role } from '@/types/interfaces/Role'

// ─── Weight configuration ─────────────────────────────────────────────────────

const WEIGHTS = {
  /** Shared skills between user and team/creator */
  skills: 40,
  /** Role complementarity score */
  role: 25,
  /** Hackathon / category domain alignment */
  domain: 20,
  /** Availability compatibility */
  availability: 15,
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchResult {
  /** Total score 0–100 (rounded integer) */
  score: number
  /** Up to 2 concise human-readable reasons shown in the card UI */
  topReasons: string[]
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function intersectionSize(a: string[] | null, b: string[] | null): number {
  if (!a?.length || !b?.length) return 0
  const setB = new Set(b.map((s) => s.toLowerCase()))
  return a.filter((s) => setB.has(s.toLowerCase())).length
}

/**
 * Skill overlap score: diminishing returns after 3 shared skills.
 * 1 skill → 25 pts, 2 → 50, 3 → 75, 4+ → 100 (of max weight)
 */
function skillScore(userSkills: string[] | null, otherSkills: string[] | null): number {
  const overlap = intersectionSize(userSkills, otherSkills)
  if (overlap === 0) return 0
  // Cap at 4 for full score
  return Math.min(overlap / 4, 1) * WEIGHTS.skills
}

/** Role complementarity score */
function roleScore(userRole: string | null, otherRole: string | null): number {
  if (!userRole || !otherRole) return 0
  const validRoles = ['Visionary', 'Builder', 'Strategist', 'Connector']
  if (!validRoles.includes(userRole) || !validRoles.includes(otherRole)) return 0
  const compat = ROLE_COMPLEMENTARITY[userRole as Role]?.[otherRole as Role]
  const points: Record<string, number> = { HIGH: 1, MEDIUM: 0.6, NEUTRAL: 0.3, LOW: 0.1 }
  return (points[compat ?? 'NEUTRAL'] ?? 0.3) * WEIGHTS.role
}

/**
 * Domain alignment for teams: hackathon_track vs team category.
 * Loose match: Engineering ↔ Engineering, Design ↔ Design, etc.
 */
function domainScore(userTrack: string | null, otherCategory: string | null): number {
  if (!userTrack || !otherCategory) return 0
  // Normalize to lowercase for comparison
  const u = userTrack.toLowerCase()
  const o = otherCategory.toLowerCase()
  if (u === o) return WEIGHTS.domain
  // Partial match for related tracks
  const related: Record<string, string[]> = {
    engineering: ['science', 'business'],
    design: ['art', 'creative'],
    business: ['engineering', 'science'],
    science: ['engineering', 'research'],
    art: ['design', 'creative'],
  }
  if (related[u]?.includes(o)) return WEIGHTS.domain * 0.5
  return 0
}

const AVAILABILITY_ORDER = ['full-time', 'flexible', 'evenings', 'weekends']

/**
 * Availability compatibility: same = full; adjacent = half; distant = 0
 */
function availabilityScore(userAvail: string | null, otherAvail: string | null): number {
  if (!userAvail || !otherAvail) return 0
  if (userAvail === otherAvail) return WEIGHTS.availability
  const ui = AVAILABILITY_ORDER.indexOf(userAvail)
  const oi = AVAILABILITY_ORDER.indexOf(otherAvail)
  if (ui === -1 || oi === -1) return 0
  const diff = Math.abs(ui - oi)
  if (diff === 1) return WEIGHTS.availability * 0.5
  return 0
}

// ─── Exported scoring functions ───────────────────────────────────────────────

/**
 * Score how well `currentUser` would fit into `team`.
 */
export function scoreTeamMatch(
  currentUser: UserProfile | null,
  team: TeamWithMembers,
): MatchResult {
  if (!currentUser) return { score: 0, topReasons: [] }

  // Treat team's existing member roles as the "other skills" dimension
  const memberRoles = team.members?.map((m) => m.role).filter(Boolean) ?? []
  const teamSkills = [...memberRoles] // teams don't have explicit skill lists; use category tags

  const s = skillScore(currentUser.skills, teamSkills)
  const r = roleScore(currentUser.role, team.members?.[0]?.role ?? null)
  const d = domainScore(currentUser.hackathon_track, team.category)
  const a = availabilityScore(currentUser.availability, null) // teams don't expose availability

  const total = Math.round(s + r + d + a)

  const reasons: Array<{ pts: number; label: string }> = [
    { pts: s, label: `${Math.round(intersectionSize(currentUser.skills, teamSkills))} shared skills` },
    { pts: r, label: 'complementary roles' },
    { pts: d, label: 'matching domain' },
    { pts: a, label: 'similar availability' },
  ]
  const topReasons = reasons
    .filter((x) => x.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 2)
    .map((x) => x.label)

  return { score: Math.min(total, 100), topReasons }
}

/**
 * Score how relevant a `work` is to `currentUser` (creator discovery).
 */
export function scoreWorkMatch(
  currentUser: UserProfile | null,
  work: WorkWithCreator,
): MatchResult {
  if (!currentUser) return { score: 0, topReasons: [] }

  // WorkCreator is the minimal view type; the actual DB view may include extra fields.
  const creatorAny = work.creator as unknown as Record<string, unknown>
  const creatorSkills = Array.isArray(creatorAny.skills) ? (creatorAny.skills as string[]) : null
  const creatorTags = work.tags

  const s = skillScore(currentUser.skills, creatorSkills)
  const t = skillScore(currentUser.tags, creatorTags) * 0.5 // tags worth half
  const r = roleScore(currentUser.role, work.creator?.role ?? null)
  const d = domainScore(currentUser.hackathon_track, work.category)

  const total = Math.round(s + t + r + d)

  const reasons: Array<{ pts: number; label: string }> = [
    { pts: s, label: `${intersectionSize(currentUser.skills, creatorSkills)} shared skills` },
    { pts: t, label: 'matching tags' },
    { pts: r, label: 'complementary roles' },
    { pts: d, label: 'same domain' },
  ]
  const topReasons = reasons
    .filter((x) => x.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 2)
    .map((x) => x.label)

  return { score: Math.min(total, 100), topReasons }
}
