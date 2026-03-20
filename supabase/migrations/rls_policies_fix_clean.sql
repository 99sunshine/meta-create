-- RLS Policies Fix - Clean and Recreate
-- This will drop ALL existing policies and create correct ones
-- Run this SQL in Supabase SQL Editor

-- ====================
-- 1. DROP ALL EXISTING POLICIES
-- ====================

-- Teams policies
DROP POLICY IF EXISTS "teams_insert_own" ON teams;
DROP POLICY IF EXISTS "teams_select_open" ON teams;
DROP POLICY IF EXISTS "teams_update_owner" ON teams;
DROP POLICY IF EXISTS "teams_delete_owner" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can view teams they own" ON teams;
DROP POLICY IF EXISTS "Users can view open teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;

-- Team members policies
DROP POLICY IF EXISTS "team_members_insert_own" ON team_members;
DROP POLICY IF EXISTS "team_members_select_all" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_own" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;

-- Works policies
DROP POLICY IF EXISTS "works_insert_own" ON works;
DROP POLICY IF EXISTS "works_select_all" ON works;
DROP POLICY IF EXISTS "works_update_own" ON works;
DROP POLICY IF EXISTS "works_delete_own" ON works;
DROP POLICY IF EXISTS "Users can create works" ON works;
DROP POLICY IF EXISTS "Users can view all works" ON works;
DROP POLICY IF EXISTS "Users can update their works" ON works;
DROP POLICY IF EXISTS "Users can delete their works" ON works;

-- ====================
-- 2. CREATE CORRECT POLICIES WITH WITH CHECK CLAUSES
-- ====================

-- ===== TEAMS TABLE =====

CREATE POLICY "Users can create teams"
ON teams
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view teams they own"
ON teams
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can view open teams"
ON teams
FOR SELECT
TO authenticated
USING (is_open = true);

CREATE POLICY "Users can update their teams"
ON teams
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- ===== TEAM_MEMBERS TABLE =====

CREATE POLICY "Users can join teams"
ON team_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view team members"
ON team_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.is_open = true
  )
  OR
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id
    AND teams.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can leave teams"
ON team_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT owner_id FROM teams WHERE id = team_id
  )
);

-- ===== WORKS TABLE =====

CREATE POLICY "Users can create works"
ON works
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all works"
ON works
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their works"
ON works
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their works"
ON works
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ====================
-- 3. VERIFY POLICIES WERE CREATED
-- ====================

SELECT tablename, policyname, cmd, 
  CASE WHEN qual IS NULL THEN 'WITH CHECK present' ELSE 'USING present' END as clause_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('teams', 'team_members', 'works')
ORDER BY tablename, policyname;
