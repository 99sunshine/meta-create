-- ============================================================
-- MetaCreate — Default hide contacted/same-team creators
--
-- Explore should prioritize fresh discovery for logged-in users:
-- - Hide creators with pending/accepted collab relation to current user
-- - Hide creators already in any of current user's teams
-- ============================================================

-- Recreate overloads to ensure the updated candidate WHERE is applied.
DROP FUNCTION IF EXISTS get_matched_creators(uuid);
DROP FUNCTION IF EXISTS get_matched_creators(uuid, boolean);
DROP FUNCTION IF EXISTS get_matched_creators(uuid, boolean, boolean);

CREATE OR REPLACE FUNCTION get_matched_creators(
  current_user_id uuid,
  same_track_only boolean DEFAULT false
)
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
  top_reason       text,
  vision_raw       numeric,
  vision_score     integer,
  has_vision       boolean
)
LANGUAGE plpgsql STABLE PARALLEL SAFE
AS $$
DECLARE
  cur RECORD;
  cur_skills       text[];
  cur_role         text;
  cur_interests    text[];
  cur_availability text;
  cur_track        text;
  cur_embed        vector(1024);
  w_vision   constant numeric := 35;
  w_skill    constant numeric := 25;
  w_role     constant numeric := 20;
  w_interest constant numeric := 12;
  w_avail    constant numeric := 8;
BEGIN
  SELECT
    p.skills, p.role, p.interests, p.availability, p.hackathon_track, p.manifesto_embedding
  INTO cur_skills, cur_role, cur_interests, cur_availability, cur_track, cur_embed
  FROM profiles p
  WHERE p.id = current_user_id;

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
        same_track_only = false
        OR cur_track IS NULL
        OR p.hackathon_track IS NULL
        OR lower(p.hackathon_track) = lower(cur_track)
      )
      AND NOT EXISTS (
        SELECT 1
        FROM collab_requests cr
        WHERE cr.status IN ('pending', 'accepted')
          AND (
            (cr.sender_id = current_user_id AND cr.receiver_id = p.id)
            OR (cr.sender_id = p.id AND cr.receiver_id = current_user_id)
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM team_members tm_self
        JOIN team_members tm_other ON tm_self.team_id = tm_other.team_id
        WHERE tm_self.user_id = current_user_id
          AND tm_other.user_id = p.id
      )
  LOOP
    DECLARE
      v_raw       numeric := 0.3;
      v_score     numeric := 0;
      v_has       boolean := false;
      cur_arr     text[] := COALESCE(cur_skills, '{}');
      tgt_arr     text[] := COALESCE(cur.p_skills, '{}');
      union_arr   text[];
      union_size  integer;
      b_has_a     integer := 0;
      a_has_b     integer := 0;
      skill_raw   numeric := 0;
      s_score     numeric := 0;
      r_score     numeric := 0;
      cur_int     text[] := COALESCE(cur_interests, '{}');
      tgt_int     text[] := COALESCE(cur.p_interests, '{}');
      i_intersect integer := 0;
      i_union     integer;
      i_score     numeric := 0;
      avail_a     text;
      avail_b     text;
      a_score     numeric := 0;
      total_raw   numeric := 0;
      final_score integer;
      reason      text := '';
    BEGIN
      IF cur_embed IS NOT NULL AND cur.p_embed IS NOT NULL THEN
        v_has := true;
        v_raw := greatest(0, least(1, 1 - (cur_embed <=> cur.p_embed)));
      ELSE
        v_has := false;
        v_raw := 0.3;
      END IF;
      v_score := v_raw * w_vision;

      IF array_length(cur_arr, 1) > 0 AND array_length(tgt_arr, 1) > 0 THEN
        SELECT array_agg(DISTINCT lower(el)) INTO union_arr
        FROM unnest(cur_arr || tgt_arr) el;
        union_size := coalesce(array_length(union_arr, 1), 0);

        IF union_size > 0 THEN
          SELECT count(*) INTO b_has_a
          FROM unnest(tgt_arr) t_el
          WHERE lower(t_el) NOT IN (SELECT lower(c_el) FROM unnest(cur_arr) c_el);

          SELECT count(*) INTO a_has_b
          FROM unnest(cur_arr) c_el
          WHERE lower(c_el) NOT IN (SELECT lower(t_el) FROM unnest(tgt_arr) t_el);

          skill_raw := ((b_has_a::numeric / union_size) + (a_has_b::numeric / union_size)) / 2;
          IF coalesce(array_length(cur_arr, 1), 0) < 3 OR coalesce(array_length(tgt_arr, 1), 0) < 3 THEN
            skill_raw := least(skill_raw, 0.5);
          END IF;
          s_score := skill_raw * w_skill;
        END IF;
      END IF;

      r_score := role_compat_score(cur_role, cur.p_role) * w_role;

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
      vision_raw      := v_raw;
      vision_score    := least(round(v_score)::integer, 35);
      has_vision      := v_has;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

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
  top_reason       text,
  vision_raw       numeric,
  vision_score     integer,
  has_vision       boolean
)
LANGUAGE sql STABLE PARALLEL SAFE
AS $$
  SELECT *
  FROM get_matched_creators(current_user_id, false::boolean);
$$;
