-- ============================================================
-- MetaCreate — Resumes storage bucket (private) + policies
--
-- Bucket:
--   resumes — uploaded resumes (private; only owner can CRUD)
--
-- Convention: path = <user_id>/<uuid>-<filename>
-- ============================================================

-- 1) Create bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies (owner-only)
DROP POLICY IF EXISTS "resumes_owner_select" ON storage.objects;
CREATE POLICY "resumes_owner_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "resumes_owner_insert" ON storage.objects;
CREATE POLICY "resumes_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "resumes_owner_update" ON storage.objects;
CREATE POLICY "resumes_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "resumes_owner_delete" ON storage.objects;
CREATE POLICY "resumes_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

