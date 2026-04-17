-- ============================================================
-- MetaCreate MVP P0 Schema — D1-3
-- Run in Supabase SQL Editor (or via CLI: supabase db push)
-- Tables: conversations, conversation_participants, messages,
--         team_works, team_invitations
-- RLS policies for all 5 tables
-- Trigger: collab_requests accepted → auto-create conversation
-- ============================================================

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Add new columns to profiles if not exists ─────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS wechat_openid text,
  ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hackathon_track text;

-- pg_trgm index for full-text search on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ── conversations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_from_request_id uuid REFERENCES collab_requests(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  last_message_at        timestamptz
);

-- ── conversation_participants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  last_read_at    timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

-- ── messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at);

-- ── team_works ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_works (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  images       text[] DEFAULT '{}',
  links        text[] DEFAULT '{}',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_works_team_id ON team_works(team_id);

-- ── team_invitations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (team_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON team_invitations(invitee_id, status);

-- ============================================================
-- RLS Policies
-- ============================================================

-- ── conversations ─────────────────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON conversations;
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversations_insert_service" ON conversations;
CREATE POLICY "conversations_insert_service"
  ON conversations FOR INSERT
  WITH CHECK (true);  -- only trigger / service_role inserts

-- ── conversation_participants ─────────────────────────────────────────────────
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select_own" ON conversation_participants;
CREATE POLICY "cp_select_own"
  ON conversation_participants FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cp_insert_service" ON conversation_participants;
CREATE POLICY "cp_insert_service"
  ON conversation_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "cp_update_own" ON conversation_participants;
CREATE POLICY "cp_update_own"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- ── messages ─────────────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participant" ON messages;
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert_participant" ON messages;
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- ── team_works ────────────────────────────────────────────────────────────────
ALTER TABLE team_works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_works_select_all" ON team_works;
CREATE POLICY "team_works_select_all"
  ON team_works FOR SELECT USING (true);

DROP POLICY IF EXISTS "team_works_insert_member" ON team_works;
CREATE POLICY "team_works_insert_member"
  ON team_works FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_works.team_id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "team_works_update_member" ON team_works;
CREATE POLICY "team_works_update_member"
  ON team_works FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_works.team_id AND tm.user_id = auth.uid()
    )
  );

-- ── team_invitations ─────────────────────────────────────────────────────────
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_inv_select" ON team_invitations;
CREATE POLICY "team_inv_select"
  ON team_invitations FOR SELECT
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

DROP POLICY IF EXISTS "team_inv_insert_leader" ON team_invitations;
CREATE POLICY "team_inv_insert_leader"
  ON team_invitations FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_admin = true
    )
  );

DROP POLICY IF EXISTS "team_inv_update_invitee" ON team_invitations;
CREATE POLICY "team_inv_update_invitee"
  ON team_invitations FOR UPDATE
  USING (invitee_id = auth.uid());

-- ============================================================
-- Trigger: collab_requests accepted → auto-create conversation
-- (idempotent: skips if conversation already exists for this request)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_accepted_collab_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_conv_id uuid;
BEGIN
  -- Only fire when transitioning to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Idempotent: skip if already created
    IF EXISTS (
      SELECT 1 FROM conversations
      WHERE created_from_request_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO conversations (created_from_request_id)
    VALUES (NEW.id)
    RETURNING id INTO new_conv_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (new_conv_id, NEW.sender_id),
           (new_conv_id, NEW.receiver_id);

    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (new_conv_id, NEW.receiver_id, '连接已建立 🎉');

    -- Update last_message_at
    UPDATE conversations
    SET last_message_at = now()
    WHERE id = new_conv_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_collab_request_accepted ON collab_requests;
CREATE TRIGGER on_collab_request_accepted
  AFTER UPDATE ON collab_requests
  FOR EACH ROW EXECUTE FUNCTION handle_accepted_collab_request();

-- ============================================================
-- Enable Realtime for messages (for D3-3 DM)
-- (Run separately if using Supabase dashboard realtime toggle)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ============================================================
