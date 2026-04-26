/**
 * Weighted matching algorithm — MetaCreate co-creator discovery.
 *
 * Unified with DB function get_matched_creators() weights:
 *   SCORE = (Vision_Alignment × 35) + (Skill_Complement × 25)
 *         + (Role_Complement × 20) + (Interest_Overlap × 12)
 *         + (Availability_Match × 8)
 *
 * Design principles:
 *  - Pure functions only — no side-effects, no DB calls.
 *  - Transparent: every MatchResult includes human-readable reasons.
 *  - Vision alignment uses cosine similarity when embeddings exist; otherwise neutral fallback.
 */

import type { UserProfile } from '@/types'
import type { TeamWithMembers } from '@/types'
import type { WorkWithCreator } from '@/types'
import { ROLE_COMPLEMENTARITY } from '@/types/interfaces/Role'
import type { Role } from '@/types/interfaces/Role'
import { normalizeSkill } from '@/constants/skills'

// ─── Weights (must sum to 100) ────────────────────────────────────────────────

const W = {
  vision: 35,
  skills: 25,
  role:   20,
  interests: 12,
  availability: 8,
} as const

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MatchResult {
  /** 0–100 integer */
  score: number
  /** ≤ 2 human-readable reasons shown on cards */
  topReasons: MatchReason[]
}

export type MatchReasonKey =
  | 'teamNeedsRole'
  | 'skillVarietyMatch'
  | 'matchingDomain'
  | 'matchingAvailability'

export interface StructuredMatchReason {
  key: MatchReasonKey
  vars?: Record<string, string | number>
}

export type MatchReason = string | StructuredMatchReason

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLower(arr: string[] | null | undefined): string[] {
  return (arr ?? []).map((s) => normalizeSkill(s).toLowerCase()).filter(Boolean)
}

function parseVectorText(v: unknown): number[] | null {
  if (Array.isArray(v) && v.every((x) => typeof x === 'number')) return v as number[]
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  // Accept "[1,2,3]" or "(1,2,3)"
  const body = s.startsWith('[') && s.endsWith(']') ? s.slice(1, -1)
    : s.startsWith('(') && s.endsWith(')') ? s.slice(1, -1)
    : s
  const parts = body.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isFinite(n))) return null
  return nums
}

function cosineSimilarity(a: number[], b: number[]): number | null {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return null
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!
    const bi = b[i]!
    dot += ai * bi
    na += ai * ai
    nb += bi * bi
  }
  if (na === 0 || nb === 0) return null
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/**
 * Dimension 0 — Vision Alignment.
 * DB definition: 1 - cosine_distance(a.embedding, b.embedding) => cosine similarity.
 * Fallback: neutral 0.3 when embedding missing.
 */
function visionScore(viewer: UserProfile | null, target: UserProfile): number {
  if (!viewer) return 0
  const va = parseVectorText((viewer as unknown as Record<string, unknown>).manifesto_embedding)
  const vb = parseVectorText((target as unknown as Record<string, unknown>).manifesto_embedding)
  const sim = va && vb ? cosineSimilarity(va, vb) : null
  const raw = sim === null ? 0.3 : Math.max(0, Math.min(1, sim))
  return raw * W.vision
}

/**
 * Dimension 1 — Skill Complementarity (PRD §6.1).
 *
 * "skills_B_has_that_A_lacks / total_unique_skills_across_both"
 * Computed symmetrically: average of (A→B complement) and (B→A complement).
 * Edge case: if either side has < 3 skills → cap at 0.5 (insufficient data).
 */
function skillComplementScore(a: string[] | null, b: string[] | null): number {
  const aLow = toLower(a)
  const bLow = toLower(b)
  if (!aLow.length || !bLow.length) return 0

  const aSet = new Set(aLow)
  const bSet = new Set(bLow)
  const union = new Set([...aLow, ...bLow])
  const totalUnique = union.size
  if (totalUnique === 0) return 0

  // What B has that A lacks
  const bHasALacks = bLow.filter((s) => !aSet.has(s)).length
  // What A has that B lacks
  const aHasBLacks = aLow.filter((s) => !bSet.has(s)).length

  const complementA2B = bHasALacks / totalUnique
  const complementB2A = aHasBLacks / totalUnique
  const avg = (complementA2B + complementB2A) / 2

  // PRD edge case: < 3 skills → cap at 0.5
  const raw = (aLow.length < 3 || bLow.length < 3) ? Math.min(avg, 0.5) : avg

  return raw * W.skills
}

/**
 * Dimension 2 — Role Complementarity (PRD §6.1 + §4 matrix).
 * HIGH=1.0, Medium=0.5, Low=0.2, Neutral=0.3
 */
function roleComplementScore(roleA: string | null, roleB: string | null): number {
  if (!roleA || !roleB) return 0
  const valid = ['Visionary', 'Builder', 'Strategist', 'Connector']
  if (!valid.includes(roleA) || !valid.includes(roleB)) return 0
  const compat = ROLE_COMPLEMENTARITY[roleA as Role]?.[roleB as Role]
  const map: Record<string, number> = { HIGH: 1.0, MEDIUM: 0.5, LOW: 0.2, NEUTRAL: 0.3 }
  return (map[compat ?? 'NEUTRAL'] ?? 0.3) * W.role
}

/**
 * Dimension 3 — Interest Overlap (Jaccard similarity, PRD §6.1).
 * score = |A ∩ B| / |A ∪ B|
 */
function interestJaccardScore(a: string[] | null, b: string[] | null): number {
  const aLow = toLower(a)
  const bLow = toLower(b)
  if (!aLow.length || !bLow.length) return 0
  const aSet = new Set(aLow)
  const bSet = new Set(bLow)
  let intersect = 0
  aSet.forEach((x) => { if (bSet.has(x)) intersect++ })
  const union = new Set([...aSet, ...bSet]).size
  if (union === 0) return 0
  return (intersect / union) * W.interests
}

/**
 * Dimension 4 — Availability Match (PRD §6.1).
 *
 * PRD uses: Available / Exploring / Unavailable
 * DB stores: full-time / flexible / evenings / weekends / (+ legacy values)
 *
 * Mapping: full-time, flexible → Available
 *          evenings, weekends → Exploring
 *          null/unknown → Exploring
 *
 * Rules:
 *  Both Available = 1.0
 *  Available + Exploring = 0.5
 *  Any Unavailable = 0.0
 *  Same hackathon track → +0.2 bonus (capped at 1.0)
 */
function normaliseAvailability(raw: string | null): 'Available' | 'Exploring' | 'Unavailable' {
  if (!raw) return 'Exploring'
  const r = raw.toLowerCase()
  if (r === 'available' || r === 'full-time' || r === 'flexible') return 'Available'
  if (r === 'unavailable') return 'Unavailable'
  return 'Exploring' // evenings, weekends, etc.
}

function availabilityScore(
  availA: string | null,
  availB: string | null,
): number {
  const a = normaliseAvailability(availA)
  const b = normaliseAvailability(availB)

  let base = 0
  if (a === 'Unavailable' || b === 'Unavailable') {
    base = 0
  } else if (a === 'Available' && b === 'Available') {
    base = 1.0
  } else {
    base = 0.5 // Available + Exploring, or Exploring + Exploring
  }

  return base * W.availability
}

// ─── User-vs-User (used in New Creators section) ──────────────────────────────

/**
 * Full PRD §6.1 score between two user profiles.
 * This is the canonical implementation — user-vs-team/work adapts from this.
 */
export function scoreUserMatch(
  viewer: UserProfile | null,
  target: UserProfile,
): MatchResult {
  if (!viewer || viewer.id === target.id) return { score: 0, topReasons: [] }

  const v = visionScore(viewer, target)
  const s = skillComplementScore(viewer.skills, target.skills)
  const r = roleComplementScore(viewer.role, target.role)
  const i = interestJaccardScore(viewer.interests, target.interests)
  const a = availabilityScore(
    viewer.availability,
    target.availability,
  )

  const total = Math.round(v + s + r + i + a)

  // Build reasons with complement count
  const aSkills = toLower(viewer.skills)
  const bSkills = toLower(target.skills)
  const aSet = new Set(aSkills)
  const complementCount = bSkills.filter((sk) => !aSet.has(sk)).length
  const interestIntersect = toLower(viewer.interests).filter((x) =>
    toLower(target.interests).includes(x)
  ).length

  const reasons: Array<{ pts: number; label: string }> = [
    { pts: v, label: '愿景一致' },
    { pts: s, label: `${complementCount} complementary skill${complementCount !== 1 ? 's' : ''}` },
    { pts: r, label: 'complementary roles' },
    { pts: i, label: `${interestIntersect} shared interest${interestIntersect !== 1 ? 's' : ''}` },
    { pts: a, label: 'matching availability' },
  ]

  const topReasons = reasons
    .filter((x) => x.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 2)
    .map((x) => x.label)

  return { score: Math.min(total, 100), topReasons }
}

// ─── User-vs-Team ─────────────────────────────────────────────────────────────

/**
 * Score how well currentUser fits a team.
 *
 * Adaptations (teams don't have all profile fields):
 *  - Skills: complement against team members' aggregated roles as skill proxies
 *  - Role: user role vs the FIRST role the team is "looking for" (or member[0] role)
 *  - Interests: not available — replaced by domain alignment (hackathon_track vs category)
 *  - Availability: user availability only (no team-level availability)
 */
export function scoreTeamMatch(
  currentUser: UserProfile | null,
  team: TeamWithMembers,
): MatchResult {
  if (!currentUser) return { score: 0, topReasons: [] }

  // Role: match against what the team is looking for
  const targetRole =
    team.looking_for_roles?.[0] ??
    team.members?.find((m) => m.id !== currentUser.id)?.role ??
    null
  const r = roleComplementScore(currentUser.role, targetRole)

  // Skills: complement against member role names treated as skill tags
  const memberRoleTags = team.members?.map((m) => m.role).filter(Boolean) ?? []
  const s = skillComplementScore(currentUser.skills, memberRoleTags)

  // Domain: interests dimension replaced by track/category alignment
  const userTrack = currentUser.hackathon_track
  const teamCat = team.category
  let domainPts = 0
  if (userTrack && teamCat) {
    const u = userTrack.toLowerCase()
    const t = teamCat.toLowerCase()
    if (u === t) {
      domainPts = W.interests // full interest weight for exact match
    } else {
      const related: Record<string, string[]> = {
        engineering: ['science', 'business'],
        design: ['art', 'creative'],
        business: ['engineering', 'science'],
        science: ['engineering', 'research'],
        art: ['design', 'creative'],
      }
      if (related[u]?.includes(t)) domainPts = W.interests * 0.5
    }
  }

  // Availability: only user side is available
  const a = availabilityScore(currentUser.availability, null)

  const total = Math.round(s + r + domainPts + a)

  const reasons: Array<{ pts: number; reason: MatchReason }> = [
    {
      pts: r,
      reason: targetRole
        ? { key: 'teamNeedsRole', vars: { role: targetRole } }
        : { key: 'teamNeedsRole', vars: { role: 'Collaborator' } },
    },
    { pts: domainPts, reason: { key: 'matchingDomain' } },
    { pts: s, reason: { key: 'skillVarietyMatch' } },
    { pts: a, reason: { key: 'matchingAvailability' } },
  ]

  const topReasons = reasons
    .filter((x) => x.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 2)
    .map((x) => x.reason)

  return { score: Math.min(total, 100), topReasons }
}

// ─── User-vs-Work (creator discovery) ────────────────────────────────────────

/**
 * Score how relevant a work's creator is to the current user.
 * Goal: surface works from complementary creators.
 */
export function scoreWorkMatch(
  currentUser: UserProfile | null,
  work: WorkWithCreator,
): MatchResult {
  if (!currentUser) return { score: 0, topReasons: [] }

  // WorkCreator is minimal; the actual DB view may carry extra fields.
  const creatorAny = work.creator as unknown as Record<string, unknown>
  const creatorSkills = Array.isArray(creatorAny.skills)
    ? (creatorAny.skills as string[])
    : null
  const creatorInterests = Array.isArray(creatorAny.interests)
    ? (creatorAny.interests as string[])
    : null

  const s = skillComplementScore(currentUser.skills, creatorSkills)
  const r = roleComplementScore(currentUser.role, work.creator?.role ?? null)
  // Interest Jaccard: fall back to tag overlap if no interests
  const i = creatorInterests?.length
    ? interestJaccardScore(currentUser.interests, creatorInterests)
    : interestJaccardScore(currentUser.tags, work.tags) * 0.7

  // Domain: user's hackathon track vs work category
  const userTrack = currentUser.hackathon_track
  const workCat = work.category
  let domainPts = 0
  if (userTrack && workCat) {
    const u = userTrack.toLowerCase()
    const c = workCat.toLowerCase()
    if (u === c) {
      domainPts = W.availability // use availability slot for domain bonus
    } else {
      const related: Record<string, string[]> = {
        engineering: ['science', 'business'],
        design: ['art', 'creative'],
        business: ['engineering', 'science'],
        science: ['engineering', 'research'],
        art: ['design', 'creative'],
      }
      if (related[u]?.includes(c)) domainPts = W.availability * 0.5
    }
  }

  const total = Math.round(s + r + i + domainPts)

  const aSkills = toLower(currentUser.skills)
  const bSkills = toLower(creatorSkills)
  const aSet = new Set(aSkills)
  const complementCount = bSkills.filter((sk) => !aSet.has(sk)).length
  const interestCount = creatorInterests?.length
    ? toLower(currentUser.interests).filter((x) => toLower(creatorInterests).includes(x)).length
    : 0

  const reasons: Array<{ pts: number; label: string }> = [
    { pts: s, label: `${complementCount} complementary skill${complementCount !== 1 ? 's' : ''}` },
    { pts: r, label: 'complementary roles' },
    { pts: i, label: interestCount > 0 ? `${interestCount} shared interests` : 'matching tags' },
    { pts: domainPts, label: 'same domain' },
  ]

  const topReasons = reasons
    .filter((x) => x.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 2)
    .map((x) => x.label)

  return { score: Math.min(total, 100), topReasons }
}
