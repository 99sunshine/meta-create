/**
 * Ice-breaker text generation.
 *
 * Strategy:
 * 1. First, try the /api/ai/icebreaker server route (AI-powered, optional).
 * 2. On failure / timeout / env var missing, fall back to local template stubs.
 *
 * The templates below are meaningful enough to be useful without AI.
 * Once an AI key is configured, the route handler replaces them with dynamic output.
 */

export interface IceBreakerParams {
  senderName: string
  senderRole?: string | null
  senderTrack?: string | null
  senderSkills?: string[] | null
  senderManifesto?: string | null
  receiverName: string
  receiverRole?: string | null
  receiverTrack?: string | null
  receiverSkills?: string[] | null
  receiverManifesto?: string | null
  type?: string
}

// ── Local template stubs ──────────────────────────────────────────────────────

const TEMPLATES: Record<string, (p: IceBreakerParams) => string> = {
  just_connect: (p) =>
    `Hi ${p.receiverName}! I'm ${p.senderName}${p.senderRole ? `, a ${p.senderRole}` : ''}. I came across your profile on MetaCreate and I'd love to connect — your work really resonates with me. Would you be open to a quick chat?`,

  join_project: (p) =>
    `Hey ${p.receiverName}! I'm ${p.senderName}${p.senderRole ? ` (${p.senderRole})` : ''} and I'm genuinely excited by what you're building. I think my background could add real value to your project — would love to explore collaborating!`,

  invite_to_team: (p) =>
    `Hi ${p.receiverName}! I'm ${p.senderName} and I'm putting together a team. Your profile caught my eye — a ${p.receiverRole ?? 'creator'} with your background is exactly what we're looking for. Interested in learning more?`,

  default: (p) =>
    `Hey ${p.receiverName}! I'm ${p.senderName} on MetaCreate. I'd love to connect and explore opportunities to collaborate with you!`,
}

/** Generate a local template ice-breaker (always succeeds, no network). */
export function generateIceBreaker(params: IceBreakerParams): string {
  const key = params.type ?? 'default'
  const fn = TEMPLATES[key] ?? TEMPLATES.default
  return fn(params)
}

/**
 * Try to generate an AI ice-breaker via the server route.
 * Falls back to local template on any failure.
 */
export async function generateIceBreakerAI(params: IceBreakerParams): Promise<string> {
  try {
    const res = await fetch('/api/ai/icebreaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(8000), // 8 s timeout
    })
    if (!res.ok) throw new Error(`AI route returned ${res.status}`)
    const { text } = await res.json()
    if (typeof text === 'string' && text.trim()) return text
    throw new Error('empty response')
  } catch {
    // Fallback — never block the user
    return generateIceBreaker(params)
  }
}
