/**
 * Client-side analytics utility.
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics'
 *   trackEvent('team_created', { category: 'Engineering' })
 *
 * Events are sent to /api/analytics (server-side write to analytics_events table).
 * Failures are silently swallowed — analytics must never block the main flow.
 *
 * 10 Core Events (per PRD §8):
 *   user_signed_up, onboarding_completed, explore_searched, profile_viewed,
 *   collab_request_sent, team_created, team_joined, work_created,
 *   ai_icebreaker_generated, event_viewed
 */

export type CoreEventName =
  | 'user_signed_up'
  | 'onboarding_completed'
  | 'explore_searched'
  | 'profile_viewed'
  | 'collab_request_sent'
  | 'team_created'
  | 'team_joined'
  | 'work_created'
  | 'ai_icebreaker_generated'
  | 'event_viewed'

type EventProperties = Record<string, string | number | boolean | null>

/**
 * Fire-and-forget event tracking.
 * Always safe to call — never throws.
 */
export function trackEvent(name: CoreEventName | string, properties?: EventProperties): void {
  // Non-blocking: don't await
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, properties: properties ?? {} }),
    // keepalive ensures the request survives page unload
    keepalive: true,
  }).catch(() => {
    // Silently ignore — analytics must never break UX
  })
}
