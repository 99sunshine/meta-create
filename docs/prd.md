**METACREATE**

Global Creator Matching Platform

Product Requirements Document · MVP v3.2

Engineering-Ready Edition · Sprint 0 Scoped for 3-Week Kickoff

March 2026

Youth Meta-Create Initiative

*New York · Beijing*

# **1. Executive Summary**

MetaCreate is a AI-empowered global creator matching platform that helps students and young professionals find co-creators/ team for projects, hackathons, and creative ventures. The MVP launches as a responsive web app (PWA) in English, with Chinese localization added post-launch.

**CORE PROBLEM**

Cross-disciplinary collaboration is the bottleneck of the creative economy. Students have ideas but can’t find complementary teammates. Existing tools (Slack, Discord, Reddit, WeChat groups, LinkedIn) are too noisy, too professional, or not designed for project-based teaming. MetaCreate solves this with AI-powered profiles, intelligent search-based matching, and AI ice-breakers.

---

**MVP HERO EXPERIENCE**

The Search & Explore page is the heart of the product. A user lands on MetaCreate, completes a 5-minute onboarding, and finds a compelling potential collaborator within their first 3 minutes of exploration. Everything else supports this core loop.

---

## **1.1 Product Identity**

| **Attribute** | **Detail** |
| --- | --- |
| Product Name | MetaCreate |
| Tagline | Find Your Co-Creator |
| Platform | Responsive Web App (PWA) — mobile-first |
| Language | English at launch. Chinese localization added in Phase 2 (post-launch +4 weeks) |
| Target Launch | April 2026 (2 weeks before Space Base Challenge) |
| Target Users | 300–500 creators (Columbia + MetaCreate alumni + hackathon participants) |
| Core AI | TBD |
| Visual Theme | Cosmic aesthetic: dark backgrounds, planet-style cards, MetaFire mascot (CSS/SVG only, no 3D) |
| Matching Gene | Tiktok GitHub (projects) + Matching (AI-powered search) |

## **1.2 What’s In vs. Out for MVP**

| **Feature** | **Status** | **Rationale** |
| --- | --- | --- |
| MetaFire 3-step onboarding (2 AI moments) | IN — P0 | Core first impression; 5-minute target |
| Creator profile with 4-role badges + AI tags | IN — P0 | Identity is the product’s building block |
| Search & Explore page (hero feature) | IN — P0 | This IS the product |
| Simple weighted matching algorithm | IN — P0 | Fast, transparent, no ML needed |
| AI ice-breaker on collab requests | IN — P0 | Signature differentiator |
| Team creation + external chat link | IN — P0 | Minimum viable team formation |
| Works showcase (simplified planet cards) | IN — P0 | Portfolio for credibility; simplified CSS cards, no glow/orbit for launch |
| Event hub (Space Base Challenge) | IN — P0 | Launch context |
| 10 core analytics events | IN — P0 | Can’t improve what you can’t measure |
| Discussion threads on works/teams | OUT → Post-launch Week 2 | Valuable but not needed for matching use case |
| WeChat OAuth | OUT → Post-launch Week 3 | Email magic link works globally; CN auth added with CN localization |
| Star particle background animation | OUT → Post-launch Week 2 | Cosmetic; no impact on matching quality |
| Planet card glow/sizing/orbit animations | OUT → Post-launch Week 2 | Ship with simple colored-border circular cards first |
| Chinese localization | OUT → Post-launch Week 4 | i18n structure built from Day 1; CN copy added later |
| Swipe card matching | OUT → P1 (500+ users) | Requires critical mass to feel useful |
| In-app messaging | OUT → P1 | WeChat/Discord handles this |
| 3D universe rendering | OUT → P1 | Three.js cost not justified for MVP |

# **2. Target Users**

## **2.1 The Explorer**

**“I’m not looking for anything specific — I just want to see who’s out there.”**

Undergraduate, 19–22. Curious about cross-disciplinary work but no specific project yet. Scrolls TikTok and Instagram. Interested in creative side projects and meeting interesting people outside their major.

---

- Entry point: Explore page → browse creator profiles and new works
- Primary action: Browse, save interesting profiles, join an open team
- Success metric: Saves 5+ profiles OR joins 1 team within first week

## **2.2 The Project Initiator**

**“I have an idea and I need a designer who can ship in 2 weeks.”**

Grad student or young professional, 22–28. Has a concrete project. Posts in group chats asking for teammates and gets zero useful responses.

---

- Entry point: Search page → filter by skills, role, availability
- Primary action: Search, send collab requests with AI ice-breaker
- Success metric: Connects with 1+ qualified collaborator within 48 hours

## **2.3 The Hackathon Participant**

**“The hackathon is in 10 days and I need a team. Now.”**

Any background. Registered for Space Base Challenge. Time-pressured. Needs role-complementary teammates committed to the same event.

---

- Entry point: Event Hub → Find Teammates (track-filtered search)
- Primary action: Track-filtered search, apply to open teams, or create team and recruit
- Success metric: Complete team (2–4 people, diverse roles) before event Day 1

# **3. User Journey Map**

Optimized for speed-to-value. Zero to finding a collaborator in under 10 minutes.

| **Stage** | **User Action** | **System Response** | **Time** |
| --- | --- | --- | --- |
| 1. Landing | Arrives via social link / event page | Landing page with value prop + “Get Started” CTA | < 15s |
| 2. Sign Up | Enters email | Magic link sent; user clicks to authenticate | < 30s |
| 3. Onboard | Completes 3-step guided flow | Step 1: Basic info (1 min) → Step 2: Skills + resume AI parse (2 min) → Step 3: AI tags + manifesto (2 min) | ~5 min |
| 4. Explore | Lands on Explore (default home) | Search bar + filters + “New Creators” section + recent works feed | Immediate |
| 5. Search | Filters by skill / role / location | Results with compatibility score + top tags + role badge | < 1 min |
| 6. Connect | Sends collab request | AI ice-breaker generates 2–3 starters; recipient gets notification | < 1 min |
| 7. Team Up | Accepts request → creates/joins team | Team page with external chat link (Discord/WeChat) | < 1 min |
| 8. Showcase | Uploads finished work | Work displayed on profile + community feed | 5 min |
|  |  |  |  |

# **4. Simplified Role System (4 Roles)**

Reduced from 8 roles to 4 based on the principle: if users can’t self-identify in under 5 seconds, the system is too complex. The 4 roles map to the fundamental modes of creative collaboration.

**DESIGN DECISION**

The original 8-role system (Igniter, Analyzer, Connector, Creator, Builder, Guardian, Challenger, Translator) was untested with our target users. 8 options cause decision paralysis in a 5-minute onboarding flow. We consolidate to 4 clear archetypes. If user research (post-launch survey at N=50) shows demand for more granularity, we expand to 6 roles in Phase 2.

---

| **Role** | **One-Liner** | **Combines v3.1 Roles** |
| --- | --- | --- |
| Visionary | “I see the big picture and generate ideas.” | Igniter + Challenger |
| Builder | “I make things work — code, design, prototype.” | Builder + Creator |
| Strategist | “I plan, analyze, and keep us on track.” | Analyzer + Guardian |
| Connector | “I bridge people, disciplines, and ideas.” | Connector + Translator |

**How Roles Are Used**

- Onboarding Step 2: Users tap ONE role (required). Takes < 5 seconds.
- Profile display: Role shown as badge next to name (icon + label)
- Search filter: Users can filter by role to find complementary teammates
- Matching algorithm: Role complementarity is one of 4 scoring dimensions (see Section 6)
- Team page: Shows role distribution — highlights gaps (e.g., “Your team has no Builder yet”)

**Role Complementarity Matrix (Used in Matching)**

|  | **Visionary** | **Builder** | **Strategist** | **Connector** |
| --- | --- | --- | --- | --- |
| Visionary | Neutral | HIGH | HIGH | Medium |
| Builder | HIGH | Low | Medium | Medium |
| Strategist | HIGH | Medium | Low | Medium |
| Connector | Medium | Medium | Medium | Low |

HIGH = strongly complementary (prioritized in matching). Low = same type (deprioritized unless user specifically searches for it).

# **5. Information Architecture**

## **5.1 Site Map**

| **Page** | **URL** | **Description** | **Auth** |
| --- | --- | --- | --- |
| Landing | / | Marketing + sign-up CTA | No |
| Onboarding | /onboarding | MetaFire 3-step profile creation | Yes |
| Explore (HOME) | /explore | Search + filters + new creators + works feed — HERO PAGE | Yes |
| Creator Profile | /creator/:id | Full profile with role badge, tags, works, actions | Public |
| Teams | /teams | My teams + open teams directory | Yes |
| Team Detail | /team/:id | Members, description, external chat link | Public |
| Event Hub | /events/space-base | Tracks, schedule, team registration, find teammates | Yes |
| Settings | /settings | Account, notifications | Yes |

## **5.2 Navigation (Bottom Bar — Mobile / Sidebar — Desktop)**

- Explore 🔭: Search + feed — default home tab
- Teams 🚀: My teams + open teams + invitations
- Events 🌍: Hackathon hub
- Me 🔥: My profile + works + settings

## **5.3 Required Wireframes (UI-UX Deliverables)**

| **Screen** | **Fidelity** | **Deadline** | **Key Design Decisions to Resolve** |
| --- | --- | --- | --- |
| 1. Explore / Search Page | HIGH-FI | Sprint 0 Week 2 | Search bar placement, filter chip style, result card layout (how much info per card?), compatibility score display format, empty state design |
| 2. Onboarding Flow (3 steps) | HIGH-FI | Sprint 0 Week 2 | MetaFire mascot size and placement, resume upload UX, skill picker interaction (grid vs. list vs. search), role selection UI (4 cards), tag review/edit interface |
| 3. Creator Profile | LOW-FI | Sprint 0 Week 3 | Layout hierarchy, role badge prominence, tags visual treatment, works gallery grid, collab request button placement |
| 4. Planet Card Component | HIGH-FI | Sprint 0 Week 2 | MVP simplified version: circular thumbnail + colored border (domain color) + title + 2 tags. Define the “simple” version now; define the “polished” version (glow, sizing, orbit) for post-launch |

# **6. Matching Algorithm (Simple Weighted Score)**

**DESIGN PRINCIPLE**

No ML, no embeddings, no vector database. The matching algorithm is a transparent weighted score that an intern can understand, debug, and explain to users. We upgrade to smarter matching only after we have behavioral data (which matches lead to actual teams).

---

## **6.1 Compatibility Score Formula**

For any two users A and B, the compatibility score (0–100) is:

**SCORE = (Skill_Complement × 40) + (Role_Complement × 25) + (Interest_Overlap × 20) + (Availability_Match × 15)**

---

**Dimension 1: Skill Complementarity (0–1, weight: 40%)**

Measures how much B’s skills fill gaps that A doesn’t have.

**Formula:** skills_B_has_that_A_lacks / total_unique_skills_across_both

- Example: A has [Python, UX Design]. B has [3D Modeling, UX Design, Blender]. B has 2 skills A lacks (3D Modeling, Blender) out of 4 total unique skills = 0.50
- Symmetric: We compute in both directions and take the average
- Edge case: If either user has < 3 skills, score is capped at 0.5 (insufficient data for meaningful complement)

**Dimension 2: Role Complementarity (0–1, weight: 25%)**

Uses the 4-role complementarity matrix from Section 4.

- HIGH pairing (e.g., Visionary + Builder) = 1.0
- Medium pairing = 0.5
- Low pairing (same role) = 0.2
- Neutral = 0.3

**Dimension 3: Interest Overlap (0–1, weight: 20%)**

Jaccard similarity on interest tags.

**Formula:** |interests_A ∩ interests_B| / |interests_A ∪ interests_B|

- Example: A interests [sci-fi, architecture, gaming]. B interests [sci-fi, music, gaming]. Overlap = 2, Union = 4, Score = 0.50

**Dimension 4: Availability Match (0 or 1, weight: 15%)**

- Both “Available now” = 1.0
- One “Available” + one “Exploring” = 0.5
- One or both “Unavailable” = 0.0
- If both have the same hackathon track selected: +0.2 bonus (capped at 1.0)

## **6.2 Implementation**

- Computed on-the-fly per search query (not pre-computed). With 500 users, computing 500 scores takes < 100ms in PostgreSQL.
- SQL: Create a Supabase database function (plpgsql) that takes a user_id and returns top N matches with scores.
- Caching: No caching for MVP. Scores are fresh every search.
- Display: Score shown as a simple bar or number (0–100) on each search result card. No “AI compatibility” branding — just “Match score.”

## **6.3 Search Result Ranking**

- Default sort: Match score (descending)
- Alternative sorts: Newest profiles, Nearest location
- Filters narrow the pool BEFORE scoring. Score is only computed on the filtered set.
- If filtered set < 5 results: Show results + “Try broadening your search” prompt

# **7. Feature Specifications (P0)**

## **7.1 F1: MetaFire Onboarding (5-Minute Flow)**

3-step guided flow with MetaFire mascot illustrations and 2 AI moments.

| **Step** | **Name** | **~Time** | **Input** | **AI?** | **Collects** |
| --- | --- | --- | --- | --- | --- |
| 1 | Ignition | 1 min | Form fields + avatar | No | Name, avatar, city, school, email |
| 2 | Your Universe | 2 min | PDF upload OR tap-select | Yes (resume) | Skills (min 3), role (1 of 4), interests, collab style |
| 3 | Launch | 2 min | Review + edit AI output | Yes (tags) | 6–10 AI tags, manifesto, role confirmation → profile goes live |

**Step 1: Ignition**

- Fields: Display name (req), Avatar upload (opt, default = initial-based), City (req, autocomplete), School/Org (req, top 100 universities pre-loaded), Email (req)
- MetaFire copy: “Hey! I’m MetaFire. Let’s set up your creator identity — about 5 minutes.”

**Step 2: Your Universe**

- **Path A — Resume Upload:** PDF → Claude API extracts education, experience, skills, languages in <5s → user confirms/edits
- **Path B — Quick Pick:** Tap-to-select from skill grid (120+ across 8 categories) + interest tags (30+) + role selection (4 cards, pick 1)
- Collaboration style: Single select — Sprint-lover / Marathon-runner / Flexible
- Skip: All fields except 3 minimum skills are skippable

**Step 3: Launch**

- Claude API generates: 6–10 personality tags (#Hyphenated-Phrase format), 1-sentence manifesto, role confirmation
- User can: Edit tags, rewrite manifesto, change role, regenerate all (1 retry)
- CTA: “Launch My Profile 🚀” → profile published → lands on Explore
- Fallback: If Claude API fails (>8s timeout): show pre-built tag picker + generic manifesto template

**Tag gen prompt:** Model: claude-sonnet-4-20250514 | Tokens: 500 | Temp: 0.85 | Output: JSON { tags[], manifesto, role_confirmation } | Key rule: Never output generic tags like #Creative or #Hardworking. Blend professional identity with personal quirks.

## **7.2 F2: Creator Profile**

A “cosmic creator card” designed for 10-second scanability.

**Profile Layout (Mobile-First)**

1. Header: Dark gradient background + avatar + display name + city/school
2. Role Badge: Icon + label (e.g., 🔥 Visionary)
3. Manifesto: 1 sentence, large centered text
4. Tags: 6–10 AI-generated personality tags as colored chips
5. Skills: Hard skill tags, grouped by category with domain color coding
6. Collab Info: Availability + style (Sprint/Marathon) + languages
7. Works Gallery: Simplified planet cards (circular, colored border, no animation for launch)
8. Action Bar (sticky bottom): “Send Collab Request” + “Share” + “Save”

## **7.3 F3: Search & Explore (Hero Feature)**

**THIS IS THE PRODUCT**

70%+ of user time is here. Every decision optimizes for: how quickly can a user find someone exciting to work with?

---

**Explore Page Layout**

1. Search bar (always visible at top) with expandable filter chips below
2. “New Creators This Week” section — horizontal scroll of recent profiles (replaces AI recommendations for launch; honest, no cold-start problem)
3. Community feed: Chronological stream of recent works + open team recruitment posts. Toggle: All / Works / Teams Recruiting

**Search Filters**

| **Filter** | **Type** | **Options** |
| --- | --- | --- |
| Skills | Multi-select + type-ahead | 120+ skill taxonomy |
| Role | Multi-select (icon chips) | 4 roles |
| Location | Single-select + search | City-level + “Remote OK” toggle |
| Availability | Single-select | Available / Exploring / Unavailable |
| Collab Style | Single-select | Sprint / Marathon / Flexible |
| Hackathon Track | Single-select | Engineering / Society / Aesthetics / Open (event season only) |

**Search Results**

- Card: Avatar + name + role badge + top 3 tags + shared tags highlighted + match score (0–100) + “Connect” button
- Sort: Best Match (default) / Newest / Nearest
- Infinite scroll, 20 per load
- Empty state: MetaFire “No exact matches. Try broadening your search!” + “Post a Recruitment” CTA

**Natural language search:** DEFERRED to post-launch. MVP uses structured filters only. NL search requires prompt engineering and testing that doesn’t fit Sprint 0–2. Add it as a Week 2 post-launch enhancement.

## **7.4 F4: AI Ice-Breaker & Collab Requests**

**Flow**

1. User clicks “Send Collab Request” on profile or search card
2. Modal: Request type (Join my project / Invite to yours / Just connect) + message field (20–300 chars, required)
3. MetaFire appears: “Need help breaking the ice?” → generates 2–3 personalized starters
4. User can: Use a suggestion (one tap), edit, or write their own
5. Recipient sees: Sender’s mini profile + message + AI “why you’d work well together” blurb (1–2 sentences)
6. Recipient: Accept / Decline / View Full Profile

**Ice-breaker prompt:** Model: claude-sonnet-4-20250514 | Tokens: 300 | Temp: 0.9 | Input: Both profiles | Output: JSON { icebreakers: string[3], compatibility_blurb: string } | 3 tones: (1) project-focused, (2) personality-driven, (3) curiosity question. Latency: < 3s. Fallback: 3 template starters.

- Rate limit: Max 10 outbound requests per user per day

## **7.5 F5: Team Management**

- Any user can create a team (max 6 members)
- Required: Team name, description (50–500 chars), primary category
- Optional: Looking-for roles (e.g., “We need a Builder”), target event, external chat link
- Team page shows: All members with role badges, description, linked works, “Join” button if open
- External chat bridge: User pastes Discord/WeChat/Feishu link; displayed as “Join our chat” button
- Open teams appear in Explore feed and search results
- Hackathon teams get event badge and featured placement in event hub
- Team role gap: System shows “Your team has no Strategist yet” based on member roles

## **7.6 F6: Works Showcase**

**Supported Types**

| **Type** | **Format** | **Max** |
| --- | --- | --- |
| Image Gallery | JPG, PNG, WebP (up to 9) | 5 MB/img |
| Project Link | External URL (GitHub, Figma, etc.) | N/A |
| Video | Embedded YouTube link | N/A |
| Document | PDF upload | 20 MB |

**Work Metadata**

- Title (5–80 chars) + Description (20–500 chars) + Tags (1–5) + Collaborators (tag MetaCreate users) + Event badge (auto if during event)

**MVP Planet Card (Simplified)**

- Shape: Circular thumbnail with colored border (domain color: Engineering=blue, Design=purple, Arts=orange, Science=green, Business=gold)
- No glow, no sizing variation, no orbit rings for launch. These are post-launch visual polish.
- Hover/tap: Expand to show title + 2 tags + save count

## **7.7 F7: Event Hub (Space Base Challenge)**

- Event landing with track overview cards (Engineering, Society, Aesthetics, Open)
- Track selection stored on user profile; used as search filter
- “Find Teammates”: Pre-filtered search (event + track)
- Team registration: Link MetaCreate team + select track
- Event info: Schedule, venues, countdown, logistics
- Multi-node: Team cards show “New York” / “Beijing” badge
- Post-event: Winning teams featured; all hackathon works tagged

# **8. Analytics: 10 Core Events**

**MEASUREMENT PRINCIPLE**

Every KPI in Section 11 must be derivable from these 10 events. If you can’t measure it, you can’t improve it. Events are logged to a Supabase analytics_events table via edge functions. No external analytics tool dependency for core metrics.

---

| **#** | **Event Name** | **Trigger** | **Properties** | **KPI It Powers** |
| --- | --- | --- | --- | --- |
| 1 | onboarding_step_completed | User finishes each onboarding step | step_number (1/2/3), time_spent_seconds, used_resume_upload (bool), role_selected | Onboarding completion rate, median onboarding time, resume upload rate |
| 2 | profile_launched | User clicks “Launch My Profile” | tags_count, tags_edited (bool), manifesto_edited (bool), role | Activation rate, AI tag acceptance rate |
| 3 | search_executed | User submits a search (via filters) | filters_used (array), result_count, has_results (bool) | Searches per user/week, most-used filters, empty search rate |
| 4 | profile_viewed | A user views another’s profile | viewer_id, viewed_id, source (search/feed/team/direct) | Discovery funnel, which sources drive profile views |
| 5 | collab_request_sent | User sends a collaboration request | sender_id, recipient_id, request_type, used_icebreaker (bool), match_score | Requests sent volume, ice-breaker usage rate, score-to-request correlation |
| 6 | collab_request_responded | Recipient accepts or declines | request_id, response (accepted/declined), time_to_respond_hours | Acceptance rate, response time |
| 7 | team_created | User creates a new team | team_id, member_count, has_event (bool), event_track | Teams formed count, hackathon coverage |
| 8 | team_joined | User joins an existing team | team_id, user_id, source (invite/open_team/search) | Team growth sources, open team conversion rate |
| 9 | work_published | User publishes a work/project | work_id, type (image/video/link/doc), tags_count, has_collaborators (bool) | Content creation volume, portfolio adoption |
| 10 | session_started | User opens the app (new session = >30 min gap) | user_id, platform (mobile/desktop), referrer | DAU/WAU, retention, platform split |

**Implementation**

- Supabase table: analytics_events (id UUID, event_name TEXT, user_id UUID, properties JSONB, created_at TIMESTAMPTZ)
- Client: Thin wrapper function trackEvent(name, properties) called from React components
- Server: Supabase edge function inserts row with auto-timestamp
- Dashboard: Simple SQL queries run manually for the first month. Build a proper dashboard in Phase 2.
- Privacy: No PII in event properties. User IDs are UUIDs, not emails. Events table has RLS: admin-only read.

# **9. Data Model**

6 core entities + 1 analytics table. All on Supabase (PostgreSQL) with Row Level Security.

**User**

| **Field** | **Type** | **Req** | **Notes** |
| --- | --- | --- | --- |
| id | UUID (PK) | Y | Auto |
| email | VARCHAR(255) | Y | Unique, auth |
| display_name | VARCHAR(80) | Y |  |
| avatar_url | TEXT | N | Supabase Storage |
| city | VARCHAR(100) | Y |  |
| school_org | VARCHAR(200) | Y | Top 100 universities autocomplete |
| major | VARCHAR(200) | N |  |
| education_level | ENUM | N | Undergrad/Master/PhD/Pro |
| locale | VARCHAR(5) | Y | Default: en. Future: zh |
| bio_raw | JSONB | N | Structured resume data |
| skills | TEXT[] | N | Min 3 for onboarding |
| interests | TEXT[] | N |  |
| ai_tags | TEXT[] | N | AI-generated |
| manifesto | TEXT | N |  |
| role | ENUM | Y | Visionary/Builder/Strategist/Connector |
| collab_style | ENUM | N | Sprint/Marathon/Flexible |
| availability | ENUM | Y | Available/Exploring/Unavailable |
| languages | TEXT[] | N |  |
| event_tracks | TEXT[] | N | Hackathon tracks |
| subscription_tier | ENUM | Y | Default: free. Future: premium (monetization hook) |
| onboarding_complete | BOOLEAN | Y | Default: false |
| created_at / updated_at | TIMESTAMP | Y | Auto |

**Team**

| **Field** | **Type** | **Req** | **Notes** |
| --- | --- | --- | --- |
| id | UUID (PK) | Y |  |
| name | VARCHAR(120) | Y |  |
| description | TEXT | Y | 50–500 chars |
| category | VARCHAR(50) | N |  |
| is_open | BOOLEAN | Y |  |
| looking_for_roles | TEXT[] | N | 4 roles |
| event_id | UUID (FK) | N |  |
| event_track | VARCHAR(50) | N |  |
| external_chat_url | TEXT | N | Discord/WeChat link |
| max_members | INT | Y | Default: 6 |
| created_by | UUID (FK) | Y |  |
| created_at | TIMESTAMP | Y |  |

**TeamMember**

| **Field** | **Type** | **Req** | **Notes** |
| --- | --- | --- | --- |
| team_id + user_id | UUID (FK), composite PK | Y |  |
| role_in_team | ENUM | N | 4 roles |
| is_admin | BOOLEAN | Y |  |
| joined_at | TIMESTAMP | Y |  |

**Work**

| **Field** | **Type** | **Req** | **Notes** |
| --- | --- | --- | --- |
| id | UUID (PK) | Y |  |
| user_id | UUID (FK) | Y | Author |
| title | VARCHAR(80) | Y |  |
| description | TEXT | Y | 20–500 |
| type | ENUM | Y | Image/Video/Link/Doc |
| media_urls | TEXT[] | N |  |
| external_url | TEXT | N |  |
| tags | TEXT[] | N |  |
| collaborator_ids | UUID[] | N |  |
| event_id | UUID (FK) | N |  |
| save_count | INT | Y | Denormalized |
| created_at | TIMESTAMP | Y |  |

**CollabRequest**

| **Field** | **Type** | **Req** | **Notes** |
| --- | --- | --- | --- |
| id | UUID (PK) | Y |  |
| from_user_id | UUID (FK) | Y |  |
| to_user_id | UUID (FK) | Y |  |
| type | ENUM | Y | Join/Invite/Connect |
| message | TEXT | Y | 20–300 chars |
| ai_icebreakers | JSONB | N |  |
| ai_match_blurb | TEXT | N |  |
| match_score | INT | N | 0–100 |
| status | ENUM | Y | Pending/Accepted/Declined |
| team_id | UUID (FK) | N |  |
| created_at | TIMESTAMP | Y |  |

**AnalyticsEvent**

| **Field** | **Type** | **Req** | **Notes** |
| --- | --- | --- | --- |
| id | UUID (PK) | Y | Auto |
| event_name | VARCHAR(50) | Y | One of 10 core events |
| user_id | UUID (FK) | Y |  |
| properties | JSONB | Y | Event-specific data |
| created_at | TIMESTAMPTZ | Y | Auto |

# **10. Technical Architecture**

| **Layer** | **Technology** | **Rationale** |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR for SEO; Tailwind for speed; PWA via next-pwa |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + Storage) | BaaS: auth (magic link + Google OAuth), RLS, storage |
| AI | Claude API (claude-sonnet-4-20250514) | Onboarding tags, resume parse, ice-breakers |
| Search | Supabase Full-Text Search + pg_trgm | Good for <1K users; upgrade to pgvector later |
| Matching | PostgreSQL function (plpgsql) | Weighted score computed per-query; no external service |
| i18n | next-intl (structure only) | EN at launch; i18n keys in place for CN addition later |
| Hosting | Vercel | Global CDN, preview deploys |
| Auth | Supabase Auth: Email magic link + Google OAuth | WeChat OAuth added with CN localization (post-launch) |
| Monitoring | Sentry + analytics_events table | Errors via Sentry; product metrics via custom events |

**AI Integration Map**

| **Feature** | **Trigger** | **Latency** | **Fallback** |
| --- | --- | --- | --- |
| Resume Parse | Step 2 PDF upload | < 5s | Manual entry form |
| Tag + Manifesto Gen | Step 3 auto | < 5s | Pre-built tag picker |
| Ice-Breaker Gen | Collab request modal | < 3s | 3 template starters |
| Match Blurb | Collab request sent | < 3s | Generic template |

Estimated Claude API cost (300 users, Month 1): ~$40–70.

# **11. Development Plan**

## **11.1 Team**

| **Role** | **Person** | **Focus** |
| --- | --- | --- |
| Lead Full-Stack | Liu Jinchang (Carlos) | Architecture, DB, matching algorithm, AI integration, search |
| Frontend Dev | Intern 1 | Onboarding flow, profile pages, Explore page, responsive |
| Frontend/Design | Intern 2 | Component library, landing page, event hub, works gallery |
| Product + Design | Zhao Jiayi (Vectra) | Wireframes (4 screens), MetaFire mascot, user testing, QA |
| PM + AI Prompts | Cai Xiang (Alice) | Requirements, prompt engineering, user research, launch ops |

## **11.2 Sprint Schedule (10 Weeks + 3-Week Sprint 0)**

**Sprint 0: Foundation (3 Weeks)**

| **Week** | **Engineering (Carlos + Interns)** | **Design (Vectra)** | **PM (Alice)** |
| --- | --- | --- | --- |
| W1 | Project init: Next.js + Supabase + Vercel. Auth flow (email magic link + Google OAuth). Supabase schema creation (all 7 tables). i18n structure (next-intl, EN only, keys in place for CN). | Design system kickoff: color palette, typography, spacing, component inventory. Begin wireframe: Explore page. | Finalize skill taxonomy (120+ skills). Define 4-role descriptions + complementarity matrix. Commission MetaFire mascot (6 expressions). |
| W2 | Component library: buttons, cards, forms, nav bar, search bar, filter chips. Supabase RLS policies. Analytics event tracking function (trackEvent wrapper + edge function + analytics_events table). | HIGH-FI wireframe: Explore page (approved). HIGH-FI wireframe: Onboarding 3-step flow. HIGH-FI wireframe: Planet card component (simplified). Begin LOW-FI: Creator profile. | Skill taxonomy validated with 5 users. 4-role survey: test with 20 community members (can they self-select in <5 sec?). Finalize MetaFire copy deck (all onboarding + empty states). |
| W3 | Matching algorithm: plpgsql function implementing weighted score formula. Full-text search index on users table. Seed database with 20 test profiles. End-to-end smoke test: register → onboard stub → search → view profile. | LOW-FI wireframe: Creator profile (approved). MetaFire mascot: 6 expressions delivered (SVG/PNG). All wireframes handed off to engineering with annotation. | 4-role survey results analyzed. If >70% can self-select: proceed with 4 roles. If not: simplify to 3 or adjust labels. Landing page copy finalized. QA plan written for Sprint 1–4. |

**SPRINT 0 EXIT CRITERIA**

Do NOT start Sprint 1 until all of these are true: (1) Auth works end-to-end. (2) All 7 DB tables created with RLS. (3) Matching algorithm returns scored results. (4) Analytics tracking fires test events. (5) Explore + Onboarding wireframes approved. (6) MetaFire 6 expressions delivered. (7) 4-role system validated by survey. (8) Skill taxonomy finalized.

---

**Sprint 1: Onboarding + Profile (Weeks 4–5)**

- MetaFire 3-step onboarding: full flow with form validation, resume upload, AI tag generation
- Creator profile page: role badge, tags, manifesto, skills, collab info, action bar
- Claude API integration: resume parse + tag generation with fallbacks
- Analytics: onboarding_step_completed + profile_launched events firing

**Milestone:** A user can register, onboard in ~5 min, and see their profile with AI-generated tags.

**Sprint 2: Search & Explore (Weeks 6–7)**

- Explore page: search bar + filters + “New Creators” section + works feed
- Search: multi-filter UI + matching algorithm integration + result cards with scores
- Collab request flow + AI ice-breaker generation
- Notification system: in-app + email (for collab requests received)
- Analytics: search_executed + profile_viewed + collab_request_sent + collab_request_responded

**Milestone:** A user can search, filter, view profiles, and send collab requests with AI ice-breakers.

**Sprint 3: Teams + Works (Weeks 8–9)**

- Team CRUD: create, manage members, external chat link, open/closed toggle
- Works upload: image gallery, project link, video embed, PDF. Simplified planet cards (colored border, no animation)
- Community feed on Explore: works + open teams, chronological, filtered
- Team role gap display: “Your team has no Strategist yet”
- Analytics: team_created + team_joined + work_published

**Milestone:** Teams can be formed. Works are published. Feed is live.

**Sprint 4: Event + Launch (Weeks 10–11)**

- Space Base Challenge event hub: tracks, schedule, find teammates, team registration
- Landing page: value prop, cosmic theme (CSS gradients + simple star dots, not full particle animation), sign-up CTA
- SEO: meta tags, OG images, SSR for landing page
- PWA configuration: add to homescreen, offline landing page
- Analytics: session_started event
- Internal QA: Team + 10 beta testers. Bug fixes. Load test (300 concurrent).

**Milestone:** MVP is live and stable. 50 seed users onboarded.

## **11.3 Post-Launch Phases**

| **Phase** | **Timing** | **What Ships** |
| --- | --- | --- |
| Seed | Launch +1 week | 50 core community profiles seeded. 5–10 user interviews. Critical bug fixes. |
| Expand | Launch +2–3 weeks | Open to full MetaCreate community (~500). Space Base Challenge registration opens. Social media push. Add: discussion threads on works + teams. Add: planet card visual polish (glow, sizing). Add: star particle background. |
| CN Localization | Launch +4–6 weeks | Chinese interface translation. WeChat OAuth integration. Bilibili video embed support. CN-specific MetaFire copy deck. WeChat/Weibo share cards. |
| Event | Launch +6–8 weeks | Space Base Challenge live. All participants on MetaCreate. Post-event: winning teams featured. |

# **12. Success Metrics**

**NORTH STAR**

Successful team formations: 2+ previously-unconnected users create a team through MetaCreate.

---

| **Category** | **Metric** | **Target** | **Derived From Event(s)** |
| --- | --- | --- | --- |
| Activation | Onboarding completion rate | ≥ 75% | onboarding_step_completed (step 3) / (step 1) |
| Activation | Median onboarding time | ≤ 7 min | onboarding_step_completed timestamps |
| Engagement | Weekly searches per active user | ≥ 3 | search_executed / session_started (unique weekly) |
| Engagement | Profile view-to-request ratio | ≥ 10% | collab_request_sent / profile_viewed |
| Matching | Collab requests sent (first month) | ≥ 150 | collab_request_sent count |
| Matching | Request acceptance rate | ≥ 30% | collab_request_responded (accepted) / total |
| Matching | Ice-breaker usage rate | ≥ 60% | collab_request_sent (used_icebreaker=true) / total |
| Teams | Teams formed (first month) | ≥ 30 | team_created count |
| Retention | 7-day return rate | ≥ 40% | session_started within 7d of first session |
| Hackathon | % hackathon teams via MetaCreate | ≥ 50% | team_created (has_event=true) / total event teams |

## **12.2 Hypotheses**

1. AI tags drive engagement: Profiles with AI tags get 2x+ views vs. profiles edited to remove tags.
2. AI ice-breakers boost acceptance: Requests using AI starters have 2x+ acceptance rate vs. custom messages.
3. 4-role system aids matching: Teams formed through role-complementary search score higher in hackathon judging.
4. 5-min onboarding holds: Completion rate ≥75% (vs. industry ~40% for multi-step).

# **13. Risks & Mitigations**

| **Risk** | **Severity** | **Mitigation** |
| --- | --- | --- |
| Sprint 0 takes longer than 3 weeks | HIGH | Hard exit criteria defined. If any criterion not met by W3 Friday, that item moves to Sprint 1 with scope trade. |
| Cold start: <100 profiles | HIGH | Pre-seed 50+ from alumni before public launch. Show “Invite friends” on empty states. |
| 4-role system doesn’t resonate | MEDIUM | Survey in Sprint 0 W2. If <70% can self-select: simplify to 3 roles (drop Connector, merge into Strategist). |
| AI quality inconsistent | MEDIUM | Prompt templates with 10+ examples. User can edit/regenerate. Human review first 50 profiles. |
| Users don’t return after onboarding | MEDIUM | Weekly email digest: “3 new creators matching your skills.” Discussion threads (post-launch W2) add return reasons. |
| Supabase limits during hackathon | LOW | Monitor; upgrade to Pro ($25/mo) preemptively at 300+ users. |
| English-only alienates Beijing users | LOW | i18n structure from Day 1. CN ships 4 weeks post-launch. Core MetaCreate community communicates in EN. |

# **14. Post-MVP Roadmap**

| **Priority** | **Feature** | **Build When** |
| --- | --- | --- |
| Post-launch W2 | Discussion threads (comments/questions on works + teams) | Immediately after launch stability confirmed |
| Post-launch W2 | Visual polish: planet card glow/sizing, star particle background | After core features stable |
| Post-launch W4 | Chinese localization + WeChat OAuth | After EN launch validated |
| Post-launch W4 | Natural language search (Claude-powered query parsing) | After structured search usage patterns analyzed |
| P1-A | Swipe card discovery | Active users > 500 |
| P1-A | AI compatibility report (detailed 2-person analysis) | Acceptance rate < 25% |
| P1-B | Gamification (coins + levels) | 7-day retention < 30% |
| P1-B | In-app messaging | Teams > 100 AND user feedback demands it |
| P1-C | 3D universe visualization | Growth marketing priority |
| P2 | Expand to 6–8 roles | N=50 survey shows demand for granularity |

# **15. Non-Functional Requirements**

| **Category** | **Requirement** | **Target** |
| --- | --- | --- |
| Performance | First Contentful Paint (landing) | < 1.5s |
| Performance | Time to Interactive (Explore) | < 3s |
| Performance | Search results render | < 1s (including matching score computation) |
| Performance | AI responses | < 5s with loading animation |
| Scalability | Concurrent users (hackathon peak) | 300+ |
| Scalability | Total registered users | 5,000+ on Supabase Pro |
| Security | Encryption at rest | AES-256 (Supabase default) |
| Security | Auth | Email magic link + Google OAuth. No passwords stored. |
| Security | Resume files | Private: signed URL, uploader-only |
| Security | API keys | Server-side only (Next.js API routes) |
| i18n | Language | English at launch. i18n keys in code for future CN. |
| Accessibility | WCAG | AA |
| SEO | Landing page | SSR, meta tags, OG images |
| PWA | Mobile | Add to homescreen, offline landing page |
| Monetization hook | subscription_tier on User model | Free-only for MVP. Infrastructure ready for premium tier. |

*— End of Document —*

**MetaCreate · From Meta-Point, To Infinite Possibilities.**

[MetaCreate MVP Blueprint](https://www.notion.so/MetaCreate-MVP-Blueprint-3195b18768b78088838efdaa48180e6b?pvs=21)

[MetaCreate MVP — UX Thought Plan](https://www.notion.so/MetaCreate-MVP-UX-Thought-Plan-31c5b18768b7800898a3e025681e16f7?pvs=21)