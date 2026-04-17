# MetaCreate — CLAUDE.md

AI-powered creator matching platform. Students and young professionals find co-creators based on role, skills, and compatibility.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase (Postgres, Auth, Storage) + Tailwind CSS 4 + Zod 4 + shadcn/ui
**AI:** DeepSeek (`deepseek-chat`) via DeepSeek API (resume parse, tag gen, ice-breaker)
**Deploy:** Vercel + Supabase Cloud
**Node:** 20 LTS only — Node 22 causes bus errors

---

## What Has Been Built

### Authentication & Onboarding
- Email/password + magic link auth (Supabase Auth), session via `AuthProvider` context
- 3-step onboarding: Step 1 (name/avatar/city/school), Step 2 (skills/role/interests/collab style), Step 3 (tags/manifesto/preview)
- Resume upload UI exists in Step 2 (fast-track path) — **parsing not wired up** (no `/api/ai/resume` route exists yet)
- Zod validation on all form steps

### Core Data Layer
- **Repository pattern** in `/supabase/repos/`: `ProfileRepository`, `TeamsRepository`, `WorksRepository`, `CollabRepository`
- All mutations validated with Zod before hitting DB
- **6 DB tables:** `profiles`, `teams`, `team_members`, `works`, `collab_requests`, `analytics_events`
- **2 views:** `works_with_creator`, `teams_with_members`
- Row Level Security enabled on all tables
- Migrations in `/supabase/migrations/`

### Profiles & Discovery
- Creator profile page `/creator/[id]`: role badge, manifesto, skills/interests, works gallery, teams, match score display
- Current user profile page `/profile`: view/edit
- Match scoring algorithm in `/lib/matching.ts` (Skill 40% + Role 25% + Interest 20% + Availability 15%)

### Explore Page (Hero Feature — partially done)
- `/explore`: community feed showing recent works + recruiting teams
- Feed filter tabs: All / Works / Teams Recruiting
- Create Team modal + Create Work modal (both functional)
- **Search bar and filter UI are missing** — the core search/discovery flow is not built

### Teams
- Create team (modal): name, description, category, looking-for roles, external chat URL, open/closed
- View team details, member list, join with role selection
- Creator auto-added as admin on creation

### Works/Portfolio
- Create work (modal): title, description, category, tags (1–5), media URLs, external links
- Works displayed on creator profiles as mini cards

### Collab Requests
- `CollabRepository` supports send/inbox/outbox, types: `join_project` / `invite_to_team` / `just_connect`
- AI ice-breaker field exists in schema
- **No UI in the explore/profile flow** to trigger a collab request

### Events
- Space Base Challenge hub at `/events/space-base`: track selection, find teammates, team registration

### Analytics
- `trackEvent()` wrapper in `/lib/analytics.ts` with 10 core events defined
- Events written to `analytics_events` table — **no dashboard to view them**

---

## What Needs to Be Done

### Critical (MVP blockers)

**1. Search & Filter UI on Explore page**
- Add search bar + filter chips (skills, role, city, availability) to `/app/explore/`
- Wire up `ProfileRepository.getRecentProfiles()` with filter params
- Display match scores from `/lib/matching.ts` on result cards
- This is the hero feature — the app is not usable without it

**2. Claude AI integration in Onboarding**
- Step 2 fast-track: create `/api/ai/resume` route using DeepSeek API to parse uploaded resume → auto-fill skills/role
- Step 3: create `/api/ai/tags` route using DeepSeek API to generate personalized tags from user's profile data instead of showing the static `TAGS_POOL`
- Add loading states and fallbacks for both

**3. Collab Request flow**
- Add "Send Collab Request" button on `/creator/[id]` and on search result cards
- Wire up `SendCollabModal` (imported but not rendered in `creator/[id]/page.tsx`)
- Call `/api/ai/icebreaker` to populate the message field
- Call `CollabRepository.sendRequest()` on submit

### High Priority

**4. Notification center**
- DB structure exists; need UI: bell icon in TopNav, notification list panel
- At minimum show pending collab requests in inbox

**5. Profile edit flow**
- `/profile` can display but edit capabilities are partial
- Need full edit form covering all onboarding fields

**6. Image uploads**
- Works and avatars currently accept external URLs only
- Integrate Supabase Storage for actual file uploads

### Medium Priority

**7. Dynamic enums from database**
- `constants/roles.ts` and `constants/enums.ts` are hardcoded
- PRD requirement: roles, skills, availability, collab styles must come from DB
- Create lookup tables; add fetch functions; update all consumers

**8. Toast/feedback system**
- Join team, send collab request, save work — none have visible success/error feedback
- Add `sonner` or similar; wire to all mutation outcomes

**9. Pagination on feeds**
- Community feed and works gallery load everything at once
- Add infinite scroll or page-based pagination

**10. next/image everywhere**
- Work gallery and avatars use plain `<img>` or initials fallback
- Swap to `next/image` for optimization

### Low Priority / Post-launch

- Analytics dashboard (even a simple Supabase SQL view)
- Google OAuth
- WeChat OAuth + Chinese localization
- Swipe-card matching UI (planned for 500+ users)
- In-app messaging
- Design token cleanup (extract inline hex colors to Tailwind config)
- Error boundaries across async pages

---

## Completion Snapshot (as of April 2026)

| Area | Status |
|------|--------|
| Auth | Done |
| Database / RLS | Done |
| Onboarding UI | ~70% — AI not wired |
| Profiles | ~90% — edit partial |
| Explore Search | ~30% — feed exists, no search/filters |
| Teams | ~85% |
| Works | ~80% |
| Collab Requests | ~50% — data layer done, UI missing |
| AI Features | ~20% — endpoints exist, not integrated |
| Notifications | ~20% — schema only |
| Events Hub | ~80% |

---

## Key File Locations

| What | Where |
|------|-------|
| Pages | `/app/` |
| Supabase repos | `/supabase/repos/` |
| Supabase client | `/supabase/utils/` |
| Auth actions | `/supabase/auth.ts` |
| DB migrations | `/supabase/migrations/` |
| Matching algorithm | `/lib/matching.ts` |
| Analytics | `/lib/analytics.ts` |
| Role / skill constants | `/constants/roles.ts`, `/constants/enums.ts` |
| Zod schemas | `/schemas/` |
| Types | `/types/` |
| AI API routes | `/app/api/ai/icebreaker/` (only one exists) |
| Full PRD | `/docs/prd.md` |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DEEPSEEK_API_KEY=           # for DeepSeek API calls in /api/ai/* routes
```

---

## Dev Commands

```bash
npm run dev     # localhost:3000
npm run build   # production build
npm run lint    # ESLint check
```
