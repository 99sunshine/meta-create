-- Fix 42P17: infinite recursion in cp_select_co_participants (subquery on same table under RLS).
-- Use SECURITY DEFINER helper so membership check bypasses RLS.

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
