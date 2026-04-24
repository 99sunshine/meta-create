the current setup has grown into a tangled mess with duplicated logic (e.g., Zod validation in actions + implicit checks in repos), scattered Supabase calls (lib/supabase + actions + repos + middleware), and hardcoded constants that scream "tech debt" (roles.ts, skills.ts, etc. should be DB-driven for scalability, especially with i18n/CN launch +4 weeks). It's slop, and starting fresh is the right call to hit April launch without constant firefighting. We'll do this elegantly: minimal layers, single sources of truth, dynamic data from DB where possible, and a structure that scales to S4 (Event Hub + polish).

This refactor aligns with your Sprint 0 exit criteria (auth works, DB live, etc.) but nukes the bloat. Estimated effort: 4–6 hours if we scaffold methodically (I'll provide code sketches + gotchas). We'll keep Next.js 14 App Router, Supabase (with generated types), Zod, shadcn/ui, and Vercel AI SDK — no TanStack Query rip-out yet (it adds value for interactive feeds like Explore; we can hybrid it later if stale data bites).

### Step 1: Core Principles for the New Build

- **Server-first where possible**: Use Server Components for reads (pass props down), Client Components only for interactivity (forms, hooks).
- **Dynamic over hardcoded**: Fetch enums/lists (roles, availability, collab styles, tracks, skills, personality tags, manifestos) from DB tables. Hardcode nothing except fallbacks (e.g., for offline PWA edge cases).
- **Single Supabase home**: All Supabase clients, queries, mutations in `/supabase`. No scattering.
- **Types/interfaces**: Dedicated `/types/interfaces` folder, one file per interface (e.g., `UserProfile.ts`, `Team.ts`).
- **Repositories**: One per entity (e.g., `ProfileRepository.ts`). Handles full CRUD (get + update/insert/delete). Calls Supabase directly (with RLS). Throws errors for hooks to handle.
- **Hooks**: Thin wrappers over repos. No extra "fetcher" abstraction — direct calls like your example. Use for client-side subs (Realtime deferred, but prep for +2-3 weeks) and mutations with loading/error states.
- **Auth**: Single `useAuth` hook. Actual Supabase auth logic in `/supabase/auth.ts` (magic link + session).
- **No duplication**: Zod schemas in `/schemas` (one per entity). Used in repos for validation. Revalidate with tags in repos (granular).
- **Bug hunting upfront**: Watch for RLS leaks (always eq('id', user.id)), Zod parse failures (handle partial FormData), session refresh in middleware, and PWA caching stale enums (fetch on mount with stale-while-revalidate).

### Step 2: New Folder Structure

Here's the cleaned tree — ~40% fewer files/directories. I removed repositories folder (fold into /supabase/repos), consolidated utils, nuked redundant constants (DB-driven now), and made types granular. Public/docs/components/app stay similar (migrate as-needed).

```
metacreate/
├── app/                          # Next.js App Router (keep route groups)
│   ├── (auth)/                   # Minimal layout
│   │   ├── login/page.tsx        # Magic link form
│   │   └── callback/route.ts     # OAuth/magic handler
│   ├── (main)/                   # With BottomBar + SpaceBackground
│   │   ├── explore/page.tsx      # Hero feed + search
│   │   ├── profile/page.tsx      # Profile view/edit
│   │   ├── teams/page.tsx        # Team CRUD
│   │   └── works/page.tsx        # Works upload/showcase
│   ├── onboarding/page.tsx       # 3-step wizard
│   ├── api/ai/route.ts           # Vercel AI SDK endpoint (Claude calls)
│   ├── layout.tsx                # Root (providers)
│   ├── page.tsx                  # Landing
│   └── globals.css
├── components/                   # Same as current, but add MetaFire + orbs/chips
│   ├── features/                 # Onboarding/teams/etc.
│   ├── shared/                   # SpaceBackground, BottomBar
│   └── ui/                       # shadcn (button, input, etc.)
├── supabase/                     # ALL Supabase stuff here — single truth
│   ├── auth.ts                   # Magic link, signOut, getSession
│   ├── client.ts                 # Browser client
│   ├── server.ts                 # Server client
│   ├── middleware.ts             # Auth refresh + guards
│   ├── repos/                    # Repos (CRUD per entity)
│   │   ├── profile.ts            # ProfileRepository class
│   │   ├── team.ts               # TeamRepository
│   │   ├── collab.ts             # CollabRequestRepository
│   │   ├── work.ts               # WorkRepository
│   │   └── analytics.ts          # AnalyticsRepository
│   └── utils.ts                  # Helpers (e.g., createClient wrapper)
├── schemas/                      # Zod (one per entity)
│   ├── profile.ts
│   ├── team.ts
│   ├── collab.ts
│   ├── work.ts
│   └── analytics.ts
├── types/                        # Generated + app models
│   ├── supabase.ts               # Auto-generated from Supabase
│   └── interfaces/               # One file per interface
│       ├── UserProfile.ts        # interface UserProfile { ... }
│       ├── Team.ts
│       ├── CollabRequest.ts
│       ├── Work.ts
│       ├── AnalyticsEvent.ts
│       ├── Role.ts               # type Role = 'Visionary' | ... (fallback; fetch dynamic)
│       ├── Availability.ts       # Similar
│       ├── CollabStyle.ts
│       └── HackathonTrack.ts
├── constants/                    # Minimal — config only (flags, limits)
│   └── config.ts                 # Feature flags, timeouts
├── hooks/                        # Thin wrappers only
│   ├── useAuth.ts                # Auth hook
│   ├── useProfile.ts             # Wrapper: getProfile, updateProfile, etc.
│   ├── useTeam.ts                # Similar
│   ├── useCollab.ts
│   ├── useWork.ts
│   └── useAnalytics.ts           # trackEvent wrapper
├── lib/                          # Non-Supabase utils
│   ├── utils/                    # cn, formatters, validators
│   └── localStorage.ts           # PWA offline helpers
├── public/                       # Assets (keep)
├── docs/                         # Keep for now (refactor.md obsolete)
├── middleware.ts                 # Keep, but import from /supabase
├── next.config.ts
├── tsconfig.json
└── package.json                  # Remove TanStack if we hybrid later
```

**Migration bugs to avoid**:

- When moving middleware.ts → supabase/middleware.ts, update imports (Next.js resolves fine, but test auth guards).
- Public/manifest.json: Ensure PWA icons point correctly post-refactor.
- Docs: Update folder-structure.md immediately — outdated docs = future bugs.

### Step 3: DB-Driven Constants (No Hardcodes)

We'll add DB tables for dynamic lists (seed in Sprint 0 W3). Fetch on app load (cache in localStorage for PWA) or per-feature (e.g., onboarding fetches roles/skills).

- New tables (add to Supabase):
  - `roles` (id, name: string, icon: string, description: string)
  - `availabilities` (id, name: string)
  - `collab_styles` (id, name: string)
  - `hackathon_tracks` (id, name: string)
  - `skill_categories` (id, name: string, skills: string[]) — JSONB array
  - `personality_tags` (id, role_id: fk, tags: string[]) — Per role
  - `manifesto_templates` (id, role_id: fk, template: string)

- Types: Keep static fallbacks in /types/interfaces (e.g., `type Role = string;` for flexibility, but union if needed for TS checks).
- Fetch example (in repo):

  ```ts
  // supabase/repos/profile.ts
  import { createClient } from '../server' // Server client
  import { z } from 'zod'

  export class ProfileRepository {
    async getRoles() {
      const supabase = await createClient()
      const { data, error } = await supabase.from('roles').select('name, icon, description')
      if (error) throw new Error(`Roles fetch failed: ${error.message}`)
      return data // [{ name: 'Visionary', icon: '🔥', ... }]
    }

    async getPersonalityTagsForRole(role: string) {
      const supabase = await createClient()
      const { data } = await supabase.from('personality_tags')
        .select('tags')
        .eq('role_name', role) // Or fk
        .single()
      if (!data) throw new Error('No tags for role')
      return data.tags // string[]
    }

    // Similar for manifestos, skills, etc.
    // Update: e.g., async updateRoles(...) { ... } if admins edit later
  }
  ```

- Bug watch: Seed data in Supabase SQL Editor (e.g., INSERT INTO roles VALUES ...). Fetch once on session start (store in context/hook), re-fetch on changes (Realtime sub post-launch). Fallback to hardcoded if DB empty (rare bug).

### Step 4: Repositories (Full CRUD, DB Changes)

Classes in /supabase/repos. Direct Supabase calls + Zod validate. Throws on error.

Example:

```ts
// supabase/repos/team.ts
import { createClient } from '../server'
import { teamSchema } from '@/schemas/team' // Zod

interface Team { /* from /types/interfaces/Team.ts */ }

export class TeamRepository {
  async getTeam(teamId: string, userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).eq('owner_id', userId).single()
    if (error) throw error
    return data as Team
  }

  async updateTeam(teamId: string, userId: string, updates: Partial<Team>) {
    const validated = teamSchema.partial().safeParse(updates)
    if (!validated.success) throw new Error(validated.error.issues[0].message)
    const supabase = await createClient()
    const { data, error } = await supabase.from('teams')
      .update({ ...validated.data, updated_at: new Date().toISOString() })
      .eq('id', teamId).eq('owner_id', userId)
      .select().single()
    if (error) throw error
    // Revalidate granularly
    revalidateTag(`team:${teamId}`)
    revalidateTag('teams:user')
    return data as Team
  }

  // Add createTeam, deleteTeam, etc.
  // For subs (Realtime prep): async getTeamSubscription(teamId: string, callback: (team: Team) => void) { ... }
}
```

Bug watch: Always include userId eq for RLS. Test with non-owner → should throw. Use .single() for one-row expectations.

### Step 5: Hooks (Thin Repo Wrappers)

Per your example: Export functions that call repo methods directly. Add loading/error via useState if needed, but keep thin (no fetcher).

Example:

```ts
// hooks/useTeam.ts
import { TeamRepository } from '@/supabase/repos/team'
import { useState } from 'react'

const teamRepo = new TeamRepository()

export function useTeam() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTeam = async (teamId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      return await teamRepo.getTeam(teamId, userId)
    } catch (err) {
      setError((err as Error).message)
      throw err // For caller to handle
    } finally {
      setLoading(false)
    }
  }

  const updateTeam = async (teamId: string, userId: string, updates: Partial<Team>) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await teamRepo.updateTeam(teamId, userId, updates)
      // Optional: toast.success('Team updated')
      return updated
    } catch (err) {
      setError((err as Error).message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Add getTeamSubscription: (teamId: string, setTeam: (team: Team) => void) => teamRepo.getTeamSubscription(teamId, setTeam)
  // Similar for create, delete

  return { getTeam, updateTeam, loading, error }
}
```

Usage in component: `const { updateTeam } = useTeam(); updateTeam(...)`

Bug watch: Hooks are client-only — mark files 'use client'. For Server Components, call repo directly (no hook).

### Step 6: Auth Cleanup

Single hook: useAuth.ts. Logic in supabase/auth.ts.

```ts
// supabase/auth.ts
'use server' // For actions

import { createClient } from './server'

export async function sendMagicLink(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback' } })
  if (error) throw error
  revalidatePath('/login')
}

export async function getSession() {
  const supabase = await createClient()
  return await supabase.auth.getSession()
}

// Add signOut, etc.
```

Hook:

```ts
// hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { sendMagicLink, getSession } from '@/supabase/auth'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await getSession()
      setSession(data.session)
      setLoading(false)
    }
    fetchSession()
  }, [])

  const login = async (email: string) => {
    try {
      await sendMagicLink(email)
    } catch (err) {
      // Handle error
    }
  }

  return { session, login, loading }
}
```

Bug watch: Middleware must refresh session (keep it). Test magic link on mobile — URL handling can flake.

### Next Steps + Timeline

1. **Now (1 hr)**: Nuke current folders (backup first). Scaffold new structure (mkdir supabase/repos, etc.).
2. **Next session (2 hrs)**: Implement DB tables + seed enums. Migrate one repo/hook (e.g., profile).
3. **Test rigorously**: Smoke test auth → onboarding (fetch roles dynamically) → update profile (DB change).
4. **Bugs to hunt**: Stale fetches (add revalidateTag everywhere), Zod FormData parse (use object input in repos), PWA install (test enums offline).

This is clean, scalable — no slop. Want code for a specific file (e.g., full ProfileRepository)? Or DB migration SQL? Hit me. 🚀
