'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import TopNav from '@/components/features/layout/TopNav'
import { Button } from '@/components/ui/button'
import { SPACE_BASE_EVENT, type EventTrack, type EventScheduleItem } from '@/lib/events'

// ── Track card ────────────────────────────────────────────────────────────────
function TrackCard({ track }: { track: EventTrack }) {
  const exploreHref = `/explore?category=${encodeURIComponent(
    track.id === 'social-impact' ? 'Other' : track.name
  )}`

  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${track.color}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{track.icon}</span>
        <h3 className="font-bold text-base">{track.name}</h3>
      </div>
      <p className="text-sm opacity-75 leading-relaxed flex-1">{track.description}</p>
      <Link href={exploreHref}>
        <span className="inline-block text-xs font-medium underline hover:opacity-90 transition-opacity">
          Find teammates →
        </span>
      </Link>
    </div>
  )
}

// ── Schedule item ─────────────────────────────────────────────────────────────
const SCHEDULE_DOT: Record<string, string> = {
  main: 'bg-orange-400',
  workshop: 'bg-blue-400',
  social: 'bg-green-400',
}

function ScheduleRow({ item }: { item: EventScheduleItem }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-1.5 shrink-0">
        <span className={`block h-2.5 w-2.5 rounded-full ${SCHEDULE_DOT[item.type] ?? 'bg-white/30'}`} />
      </div>
      <div className="flex-1 pb-4 border-b border-white/5">
        <p className="text-xs text-white/40 mb-0.5">{item.time}</p>
        <p className="text-sm font-semibold text-white">{item.title}</p>
        <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SpaceBasePage() {
  const router = useRouter()
  const event = SPACE_BASE_EVENT

  useEffect(() => {
    trackEvent('event_viewed', { event_id: event.id })
  }, [event.id])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0c1428' }}>
      {/* Star bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars opacity-40" />
        <div className="stars2 opacity-30" />
        <div className="stars3 opacity-20" />
      </div>

      <div className="relative z-10">
        <TopNav />

        {/* ── Hero ── */}
        <div
          className="pt-24 pb-16 px-4 text-center"
          style={{ background: 'linear-gradient(to bottom, rgba(231,119,15,0.12) 0%, transparent 100%)' }}
        >
          <span className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-4 border"
                style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', borderColor: 'rgba(231,119,15,0.3)' }}>
            📅 {event.date} · {event.location}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            {event.name}
          </h1>
          <p className="text-lg sm:text-xl font-medium mb-4" style={{ color: '#f5a623' }}>
            {event.tagline}
          </p>
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            {event.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push('/explore')}
              className="text-white font-semibold"
              style={{ backgroundColor: '#E7770F' }}
            >
              Find Teammates Now
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/signup')}
              className="border border-white/20 text-white/80 hover:text-white hover:bg-white/10"
            >
              Register Team
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-20 space-y-16">

          {/* ── Tracks ── */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Challenge Tracks</h2>
            <p className="text-sm text-white/50 mb-6">
              Every team chooses one track. Cross-disciplinary collaboration is encouraged.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.tracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </section>

          {/* ── Schedule ── */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Schedule</h2>
            <p className="text-sm text-white/50 mb-6">All times are Eastern Time (ET).</p>
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 sm:p-6">
              <div className="space-y-0">
                {event.schedule.map((item, i) => (
                  <ScheduleRow key={i} item={item} />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/8">
                {[['bg-orange-400', 'Main Event'], ['bg-blue-400', 'Workshop'], ['bg-green-400', 'Social']].map(([cls, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${cls}`} />
                    <span className="text-xs text-white/40">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="rounded-2xl border border-white/10 p-8 text-center"
                   style={{ background: 'linear-gradient(135deg, rgba(231,119,15,0.08), rgba(18,27,62,0.4))' }}>
            <h2 className="text-xl font-bold text-white mb-2">Ready to build?</h2>
            <p className="text-sm text-white/50 mb-6">
              Start by exploring teammates, or jump straight into creating your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/explore')}
                className="text-white font-semibold"
                style={{ backgroundColor: '#E7770F' }}
              >
                Explore Teammates
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/explore')}
                className="border border-white/15 text-white/70 hover:text-white hover:bg-white/8"
              >
                Browse Teams
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
