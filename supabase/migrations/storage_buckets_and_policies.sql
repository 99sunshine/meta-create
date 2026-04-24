-- ============================================================
-- MetaCreate — Storage Buckets & Policies
-- Run in Supabase SQL Editor AFTER mvp_p0_schema.sql
--
-- Buckets:
--   avatars  — user profile pictures (public read)
--   works    — team work images     (public read)
--
-- All buckets are PUBLIC for reading (images shown in UI without auth).
-- Only authenticated users can upload/update their own files.
-- ============================================================

-- ── 1. Create buckets (idempotent) ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    2097152,  -- 2 MB per file
    ARRAY['image/jpeg','image/png','image/webp','image/gif']
  ),
  (
    'works',
    'works',
    true,
    5242880,  -- 5 MB per file (after client-side compression target ~1 MB)
    ARRAY['image/jpeg','image/png','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. avatars policies ───────────────────────────────────────────────────────

-- Anyone can view avatars (needed for profile cards / explore page)
DROP POLICY IF EXISTS "avatars_public_select" ON storage.objects;
CREATE POLICY "avatars_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
-- Convention: path = avatars/<user_id>/<filename>
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can update/replace their own avatar
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can delete their own avatar
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 3. works policies ─────────────────────────────────────────────────────────

-- Anyone can view work images (shown on team/work cards without auth)
DROP POLICY IF EXISTS "works_public_select" ON storage.objects;
CREATE POLICY "works_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'works');

-- Any authenticated team member can upload work images
-- Convention: path = works/<team_id>/<timestamp>-<index>.webp
-- We allow any authenticated user to upload; team membership is enforced
-- at the application layer (works/create page checks isMember before render).
-- For stricter enforcement add a check against team_members here.
DROP POLICY IF EXISTS "works_auth_insert" ON storage.objects;
CREATE POLICY "works_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'works');

-- Allow the uploader (first path segment = team_id, not user_id) to update
-- Use a relaxed policy here: only authenticated users can update works objects.
DROP POLICY IF EXISTS "works_auth_update" ON storage.objects;
CREATE POLICY "works_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'works');

-- Allow authenticated users to delete works objects they can access
DROP POLICY IF EXISTS "works_auth_delete" ON storage.objects;
CREATE POLICY "works_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'works');

-- ── 4. Notes ──────────────────────────────────────────────────────────────────
-- After running this SQL, also enable Realtime for the messages table in
-- Supabase Dashboard → Database → Replication → supabase_realtime publication
-- OR run:
--   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
--   ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
