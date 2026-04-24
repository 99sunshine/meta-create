-- Sync conversation row when a message is inserted (list preview + Realtime UPDATE for inbox).
-- Also enables supabase_realtime publication when not already added.

-- 1) Columns on conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_content text,
  ADD COLUMN IF NOT EXISTS last_message_sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2) Backfill from latest message per conversation
UPDATE public.conversations c
SET
  last_message_content = LEFT(m.content, 600),
  last_message_sender_id = m.sender_id,
  last_message_at = COALESCE(c.last_message_at, m.created_at)
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id,
    content,
    sender_id,
    created_at
  FROM public.messages
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id
  AND (c.last_message_content IS NULL OR c.last_message_at IS NULL);

-- 3) Trigger: keep conversations in sync on every new message
CREATE OR REPLACE FUNCTION public.fn_messages_sync_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_content = LEFT(NEW.content, 600),
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_sync_conversation_on_insert ON public.messages;
CREATE TRIGGER messages_sync_conversation_on_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_messages_sync_conversation();

-- 4) Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;

-- 5) RLS: allow reading all participants in a conversation you belong to (for inbox batching).
-- Must use SECURITY DEFINER helper — direct EXISTS on same table causes 42P17 infinite recursion.
CREATE OR REPLACE FUNCTION public.cp_user_in_conversation(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.cp_user_in_conversation(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cp_user_in_conversation(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "cp_select_co_participants" ON public.conversation_participants;
CREATE POLICY "cp_select_co_participants"
  ON public.conversation_participants
  FOR SELECT
  TO authenticated
  USING (public.cp_user_in_conversation(conversation_id, auth.uid()));
