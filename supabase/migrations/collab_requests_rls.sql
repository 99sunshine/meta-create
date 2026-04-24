-- ============================================================
-- collab_requests RLS policies
-- Run in Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================
-- Prerequisites: collab_requests table already exists (created in initial schema migration)
-- The table schema:
--   id, sender_id, receiver_id, type, status, message, ice_breaker,
--   ai_match_blurb, match_score, team_id, created_at, responded_at

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE collab_requests ENABLE ROW LEVEL SECURITY;

-- ── SELECT: sender can see what they sent; receiver can see what they received ──
DROP POLICY IF EXISTS "collab_requests_select" ON collab_requests;
CREATE POLICY "collab_requests_select"
  ON collab_requests FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

-- ── INSERT: only authenticated users can send requests (sender_id must be own id) ──
DROP POLICY IF EXISTS "collab_requests_insert" ON collab_requests;
CREATE POLICY "collab_requests_insert"
  ON collab_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = sender_id
    AND sender_id <> receiver_id   -- cannot send to self
  );

-- ── UPDATE: only the receiver can respond (change status) ──
DROP POLICY IF EXISTS "collab_requests_update" ON collab_requests;
CREATE POLICY "collab_requests_update"
  ON collab_requests FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id
    AND status IN ('accepted', 'declined')
  );

-- ── DELETE: not allowed (keep audit trail) ──
-- No DELETE policy = nobody can delete.

-- ── Helpful index for inbox queries ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_collab_requests_receiver_id
  ON collab_requests (receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collab_requests_sender_id
  ON collab_requests (sender_id, created_at DESC);
