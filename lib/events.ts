/**
 * Static event configuration for Space Base Challenge.
 * When a real events table exists in Supabase, replace this with a DB fetch.
 */

export interface EventTrack {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

export interface EventScheduleItem {
  time: string
  title: string
  description: string
  type: 'main' | 'workshop' | 'social'
}

export const SPACE_BASE_TRACKS: EventTrack[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    icon: '⚙️',
    description: 'Build systems, tools, and infrastructure that push boundaries.',
    color: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
  },
  {
    id: 'design',
    name: 'Design',
    icon: '🎨',
    description: 'Craft experiences, visuals, and interactions that inspire.',
    color: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
  },
  {
    id: 'science',
    name: 'Science',
    icon: '🔬',
    description: 'Research and prototype at the frontier of knowledge.',
    color: 'text-green-300 border-green-500/30 bg-green-500/10',
  },
  {
    id: 'business',
    name: 'Business',
    icon: '📈',
    description: 'Shape strategy, growth, and go-to-market for bold ventures.',
    color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
  },
  {
    id: 'art',
    name: 'Art',
    icon: '✨',
    description: 'Create work that challenges, provokes, and moves people.',
    color: 'text-pink-300 border-pink-500/30 bg-pink-500/10',
  },
  {
    id: 'social-impact',
    name: 'Social Impact',
    icon: '🌍',
    description: 'Build solutions that create measurable change in the world.',
    color: 'text-teal-300 border-teal-500/30 bg-teal-500/10',
  },
]

export const SPACE_BASE_SCHEDULE: EventScheduleItem[] = [
  { time: 'Day 1 · 9:00 AM', title: 'Launch & Kickoff', description: 'Opening ceremony, mission briefing, and team formation.', type: 'main' },
  { time: 'Day 1 · 11:00 AM', title: 'Track Workshops', description: 'Deep-dive sessions for each track led by industry mentors.', type: 'workshop' },
  { time: 'Day 1 · 7:00 PM', title: 'Networking Social', description: 'Meet your fellow creators. Ice-breakers and team speed-dating.', type: 'social' },
  { time: 'Day 2 · 9:00 AM', title: 'Build Sprint', description: '24-hour build sprint begins. Mentors available on request.', type: 'main' },
  { time: 'Day 2 · 3:00 PM', title: 'Mid-point Check-in', description: 'Share progress, pivot if needed, and keep momentum.', type: 'workshop' },
  { time: 'Day 3 · 9:00 AM', title: 'Final Submissions', description: 'Projects due by 9 AM. Judges review begins.', type: 'main' },
  { time: 'Day 3 · 2:00 PM', title: 'Demo Day', description: 'Each team presents their work in 3-minute pitches.', type: 'main' },
  { time: 'Day 3 · 5:00 PM', title: 'Awards & Closing', description: 'Winners announced. Celebration and what\'s next.', type: 'social' },
]

export const SPACE_BASE_EVENT = {
  id: 'space-base-2026',
  name: 'Space Base Challenge 2026',
  tagline: 'Build for the next frontier.',
  description:
    'Space Base Challenge is MetaCreate\'s flagship hackathon bringing together students and young professionals to build the future. Form teams across disciplines, choose your track, and ship something you\'re proud of in 48 hours.',
  date: 'May 9–11, 2026',
  location: 'Columbia University + Remote',
  tracks: SPACE_BASE_TRACKS,
  schedule: SPACE_BASE_SCHEDULE,
}
