-- Unify team works into public.works with optional team_id.
-- Personal works: team_id IS NULL. Team-attached: team_id set, user_id = author.

-- 1) Add team_id (keep event_id until backfilled, then drop)
ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_works_team_id ON public.works(team_id);

-- 2) Backfill from legacy event_id when that column still exists (historically pointed at teams)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'works' AND column_name = 'event_id'
  ) THEN
    UPDATE public.works w
    SET team_id = w.event_id
    WHERE w.event_id IS NOT NULL AND (w.team_id IS NULL OR w.team_id = w.event_id);
  END IF;
END $$;

-- 3) Migrate team_works rows into works (author = team owner), when team_works exists
DO $$
BEGIN
  IF to_regclass('public.team_works') IS NOT NULL THEN
    INSERT INTO public.works (
      title,
      description,
      category,
      tags,
      images,
      links,
      user_id,
      team_id,
      save_count,
      created_at,
      updated_at,
      collaborator_ids
    )
    SELECT
      tw.title,
      COALESCE(NULLIF(trim(tw.description), ''), '—'),
      'Other',
      ARRAY['team']::text[],
      tw.images,
      tw.links,
      t.owner_id,
      tw.team_id,
      0,
      tw.submitted_at,
      tw.updated_at,
      NULL
    FROM public.team_works tw
    JOIN public.teams t ON t.id = tw.team_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.works w2
      WHERE w2.team_id = tw.team_id
        AND w2.title = tw.title
        AND w2.user_id = t.owner_id
    );
  END IF;
END $$;

-- 4) Drop view first: it uses w.* and pins dependencies on works columns (e.g. event_id)
DROP VIEW IF EXISTS public.works_with_creator;

-- 5) Drop legacy columns / team_works table
ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_event_id_fkey;
ALTER TABLE public.works DROP COLUMN IF EXISTS event_id;

DO $$
BEGIN
  IF to_regclass('public.team_works') IS NOT NULL THEN
    DROP POLICY IF EXISTS "team_works_select_all" ON public.team_works;
    DROP POLICY IF EXISTS "team_works_insert_member" ON public.team_works;
    DROP POLICY IF EXISTS "team_works_update_member" ON public.team_works;
    DROP TABLE public.team_works CASCADE;
  END IF;
END $$;

-- 6) RLS: allow creating team-attached works only for team members
DROP POLICY IF EXISTS "Users can create works" ON public.works;

CREATE POLICY "Users can create works"
ON public.works
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    team_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = works.team_id
        AND tm.user_id = auth.uid()
    )
  )
);

-- 7) Recreate view: creator + optional team summary
CREATE VIEW public.works_with_creator AS
SELECT
  w.*,
  jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'role', p.role,
    'avatar_url', p.avatar_url
  ) AS creator,
  CASE
    WHEN t.id IS NOT NULL THEN jsonb_build_object('id', t.id, 'name', t.name)
    ELSE NULL
  END AS team
FROM public.works w
LEFT JOIN public.profiles p ON w.user_id = p.id
LEFT JOIN public.teams t ON w.team_id = t.id;

GRANT SELECT ON public.works_with_creator TO authenticated;
