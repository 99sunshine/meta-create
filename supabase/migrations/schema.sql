-- =============================================================
-- MetaCreate — Table Definitions
-- Run this first, then:
--   1. supabase/migrations/rls_policies_create.sql
--   2. supabase/migrations/create_views.sql
--   3. supabase/migrations/fix_works_category_constraint.sql
-- =============================================================

-- ── Utility: auto-update updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── profiles ─────────────────────────────────────────────────────────────────
-- id mirrors auth.users.id — set by the app on signup.
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT        NOT NULL UNIQUE,
  name                TEXT        NOT NULL,
  role                TEXT        NOT NULL,
  avatar_url          TEXT,
  city                TEXT,
  school              TEXT,
  major               TEXT,
  education_level     TEXT,
  skills              TEXT[],
  interests           TEXT[],
  tags                TEXT[],
  manifesto           TEXT,
  collab_style        TEXT,
  availability        TEXT,
  languages           TEXT[],
  hackathon_track     TEXT,
  bio_raw             JSONB,
  locale              TEXT        NOT NULL DEFAULT 'en',
  subscription_tier   TEXT        NOT NULL DEFAULT 'free',
  onboarding_complete BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── teams ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  description        TEXT,
  category           TEXT        NOT NULL,
  is_open            BOOLEAN     NOT NULL DEFAULT true,
  max_members        INTEGER     NOT NULL DEFAULT 6,
  owner_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id           UUID,
  event_track        TEXT,
  external_chat_link TEXT,
  looking_for_roles  TEXT[],
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── team_members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL,
  is_admin  BOOLEAN     NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ── works ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS works (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  tags             TEXT[],
  images           TEXT[],
  links            TEXT[],
  collaborator_ids UUID[],
  event_id         UUID        REFERENCES teams(id) ON DELETE SET NULL,
  save_count       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── collab_requests ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collab_requests (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL DEFAULT 'just_connect',
  status         TEXT        NOT NULL DEFAULT 'pending',
  message        TEXT,
  ice_breaker    TEXT,
  ai_match_blurb TEXT,
  match_score    INTEGER,
  team_id        UUID        REFERENCES teams(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at   TIMESTAMPTZ
);

-- ── analytics_events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT        NOT NULL,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
