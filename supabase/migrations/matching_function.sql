-- ============================================================
-- MetaCreate — Matching Function (D2-1)
-- Extended for P0-3 Vision Alignment (pgvector manifesto embeddings)
--
-- Weights (must sum to 100):
--   Vision_Alignment   × 35  (cosine similarity on manifesto embeddings; neutral fallback 0.3)
--   Skill_Complement   × 25
--   Role_Complement    × 20
--   Interest_Overlap   × 12
--   Availability       × 8
--
-- Returns top 60 creators ordered by score (DESC), then created_at (DESC).
-- When user pool < 30, scores are returned but UI hides them (handled client-side).
-- ============================================================

-- ── Role complementarity lookup ───────────────────────────────────────────────
-- HIGH=1.0, MEDIUM=0.5, LOW=0.2, NEUTRAL=0.3
CREATE OR REPLACE FUNCTION role_compat_score(role_a text, role_b text)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE
AS $$
BEGIN
  IF role_a IS NULL OR role_b IS NULL THEN RETURN 0; END IF;
  IF role_a = role_b THEN RETURN 0.2; END IF;  -- same role = LOW

  RETURN CASE
    -- Visionary pairs
    WHEN (role_a = 'Visionary' AND role_b = 'Builder')     OR
         (role_a = 'Builder'   AND role_b = 'Visionary')   THEN 1.0   -- HIGH
    WHEN (role_a = 'Visionary' AND role_b = 'Strategist')  OR
         (role_a = 'Strategist' AND role_b = 'Visionary')  THEN 0.5   -- MEDIUM
    WHEN (role_a = 'Visionary' AND role_b = 'Connector')   OR
         (role_a = 'Connector' AND role_b = 'Visionary')   THEN 0.5   -- MEDIUM
    -- Builder pairs
    WHEN (role_a = 'Builder'   AND role_b = 'Strategist')  OR
         (role_a = 'Strategist' AND role_b = 'Builder')    THEN 0.5   -- MEDIUM
    WHEN (role_a = 'Builder'   AND role_b = 'Connector')   OR
         (role_a = 'Connector' AND role_b = 'Builder')     THEN 0.5   -- MEDIUM
    -- Strategist pairs
    WHEN (role_a = 'Strategist' AND role_b = 'Connector')  OR
         (role_a = 'Connector'  AND role_b = 'Strategist') THEN 1.0   -- HIGH
    ELSE 0.3  -- NEUTRAL
  END;
END;
$$;

-- ── Availability normalisation ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION normalise_availability(raw text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE
AS $$
BEGIN
  IF raw IS NULL THEN RETURN 'Exploring'; END IF;
  CASE lower(raw)
    WHEN 'available', 'full-time', 'flexible' THEN RETURN 'Available';
    WHEN 'unavailable' THEN RETURN 'Unavailable';
    ELSE RETURN 'Exploring';
  END CASE;
END;
$$;

-- ── Main matching function ────────────────────────────────────────────────────
-- Returns (id, name, role, city, school, skills, hackathon_track, avatar_url,
--          manifesto, tags, score, top_reason) for every candidate profile,
-- ordered by score DESC.
CREATE OR REPLACE FUNCTION get_matched_creators(current_user_id uuid)
RETURNS TABLE (
  id               uuid,
  name             text,
  role             text,
  city             text,
  school           text,
  skills           text[],
  hackathon_track  text,
  avatar_url       text,
  manifesto        text,
  tags             text[],
  score            integer,
  top_reason       text
)
LANGUAGE plpgsql STABLE PARALLEL SAFE
AS $$
DECLARE
  cur RECORD;
  -- Caller's profile fields
  cur_skills       text[];
  cur_role         text;
  cur_interests    text[];
  cur_availability text;
  cur_track        text;
  cur_embed        vector(1024);
  -- Weights (must sum to 100)
  w_vision  constant numeric := 35;
  w_skill   constant numeric := 25;
  w_role    constant numeric := 20;
  w_interest constant numeric := 12;
  w_avail   constant numeric := 8;
BEGIN
  -- Load caller profile
  SELECT
    p.skills, p.role, p.interests, p.availability, p.hackathon_track, p.manifesto_embedding
  INTO cur_skills, cur_role, cur_interests, cur_availability, cur_track, cur_embed
  FROM profiles p
  WHERE p.id = current_user_id;

  -- Iterate over all OTHER complete profiles
  FOR cur IN
    SELECT
      p.id, p.name, p.role AS p_role, p.city, p.school,
      p.skills AS p_skills, p.hackathon_track AS p_track,
      p.avatar_url, p.manifesto, p.tags,
      p.interests AS p_interests, p.availability AS p_availability,
      p.manifesto_embedding AS p_embed
    FROM profiles p
    WHERE p.id <> current_user_id
      AND p.onboarding_complete = true
      AND (
        cur_track IS NULL
        OR p.hackathon_track IS NULL
        OR lower(p.hackathon_track) = lower(cur_track)
      )
  LOOP
    DECLARE
      -- ── Vision Alignment (cosine similarity) ───────────────────────────────
      v_raw      numeric := 0.3;
      v_score    numeric := 0;
      -- ── Skill Complement (symmetric average) ──────────────────────────────
      cur_arr    text[] := COALESCE(cur_skills, '{}');
      tgt_arr    text[] := COALESCE(cur.p_skills, '{}');
      union_arr  text[];
      union_size integer;
      b_has_a    integer := 0;
      a_has_b    integer := 0;
      skill_raw  numeric := 0;
      s_score    numeric := 0;

      -- ── Role ──────────────────────────────────────────────────────────────
      r_score    numeric := 0;

      -- ── Interest Jaccard ─────────────────────────────────────────────────
      cur_int    text[] := COALESCE(cur_interests, '{}');
      tgt_int    text[] := COALESCE(cur.p_interests, '{}');
      i_intersect integer := 0;
      i_union     integer;
      i_score    numeric := 0;

      -- ── Availability ─────────────────────────────────────────────────────
      avail_a    text;
      avail_b    text;
      a_score    numeric := 0;

      -- ── Total ─────────────────────────────────────────────────────────────
      total_raw  numeric := 0;
      final_score integer;
      reason     text := '';
    BEGIN
      -- Vision alignment: neutral fallback when manifesto/embedding missing.
      IF cur_embed IS NOT NULL AND cur.p_embed IS NOT NULL THEN
        v_raw := greatest(0, least(1, 1 - (cur_embed <=> cur.p_embed)));
      ELSE
        v_raw := 0.3;
      END IF;
      v_score := v_raw * w_vision;

      -- Skill complement (lowercase, symmetric)
      IF array_length(cur_arr, 1) > 0 AND array_length(tgt_arr, 1) > 0 THEN
        -- Union
        SELECT array_agg(DISTINCT lower(el)) INTO union_arr
        FROM unnest(cur_arr || tgt_arr) el;
        union_size := coalesce(array_length(union_arr, 1), 0);

        IF union_size > 0 THEN
          -- What target has that caller lacks
          SELECT count(*) INTO b_has_a
          FROM unnest(tgt_arr) t_el
          WHERE lower(t_el) NOT IN (SELECT lower(c_el) FROM unnest(cur_arr) c_el);

          -- What caller has that target lacks
          SELECT count(*) INTO a_has_b
          FROM unnest(cur_arr) c_el
          WHERE lower(c_el) NOT IN (SELECT lower(t_el) FROM unnest(tgt_arr) t_el);

          skill_raw := ((b_has_a::numeric / union_size) + (a_has_b::numeric / union_size)) / 2;
          -- Edge case: <3 skills, cap at 0.5
          IF coalesce(array_length(cur_arr,1),0) < 3 OR coalesce(array_length(tgt_arr,1),0) < 3 THEN
            skill_raw := least(skill_raw, 0.5);
          END IF;
          s_score := skill_raw * w_skill;
        END IF;
      END IF;

      -- Role complementarity
      r_score := role_compat_score(cur_role, cur.p_role) * w_role;

      -- Interest Jaccard
      IF array_length(cur_int, 1) > 0 AND array_length(tgt_int, 1) > 0 THEN
        SELECT count(*) INTO i_intersect
        FROM unnest(cur_int) c_el
        WHERE lower(c_el) IN (SELECT lower(t_el) FROM unnest(tgt_int) t_el);

        SELECT count(DISTINCT lower(el)) INTO i_union
        FROM unnest(cur_int || tgt_int) el;

        IF i_union > 0 THEN
          i_score := (i_intersect::numeric / i_union) * w_interest;
        END IF;
      END IF;

      -- Availability
      avail_a := normalise_availability(cur_availability);
      avail_b := normalise_availability(cur.p_availability);
      IF avail_a = 'Unavailable' OR avail_b = 'Unavailable' THEN
        a_score := 0;
      ELSIF avail_a = 'Available' AND avail_b = 'Available' THEN
        a_score := w_avail;
      ELSE
        a_score := w_avail * 0.5;
      END IF;

      total_raw := v_score + s_score + r_score + i_score + a_score;
      final_score := least(round(total_raw)::integer, 100);

      -- Top reason
      CASE
        WHEN v_score >= s_score AND v_score >= r_score AND v_score >= i_score THEN
          reason := '愿景高度一致';
        WHEN s_score >= r_score AND s_score >= i_score THEN
          reason := '技能互补';
        WHEN r_score >= s_score AND r_score >= i_score THEN
          reason := '角色互补';
        WHEN i_score > 0 THEN
          reason := '兴趣相近';
        ELSE
          reason := '';
      END CASE;

      id              := cur.id;
      name            := cur.name;
      role            := cur.p_role;
      city            := cur.city;
      school          := cur.school;
      skills          := cur.p_skills;
      hackathon_track := cur.p_track;
      avatar_url      := cur.avatar_url;
      manifesto       := cur.manifesto;
      tags            := cur.tags;
      score           := final_score;
      top_reason      := reason;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- ── Index for performance (≤ 500 users target < 100ms) ───────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_complete) WHERE onboarding_complete = true;
CREATE INDEX IF NOT EXISTS idx_profiles_hackathon_track ON profiles(hackathon_track);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles(availability);

-- ── Full-text search (pg_trgm) — already created in mvp_p0_schema.sql ────────
-- These are idempotent so safe to repeat:
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm     ON profiles USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_manifesto_trgm ON profiles USING gin(manifesto gin_trgm_ops);

-- ── Helper: search profiles by text query ────────────────────────────────────
CREATE OR REPLACE FUNCTION search_profiles(query text, lim integer DEFAULT 30)
RETURNS SETOF profiles
LANGUAGE plpgsql STABLE PARALLEL SAFE
AS $$
BEGIN
  RETURN QUERY
    SELECT p.*
    FROM profiles p
    WHERE p.onboarding_complete = true
      AND (
        p.name        ILIKE '%' || query || '%'
        OR p.role     ILIKE '%' || query || '%'
        OR p.city     ILIKE '%' || query || '%'
        OR p.school   ILIKE '%' || query || '%'
        OR p.manifesto ILIKE '%' || query || '%'
        OR query = ANY(p.skills)
        OR query = ANY(p.tags)
      )
    ORDER BY similarity(p.name, query) DESC, p.created_at DESC
    LIMIT lim;
END;
$$;
