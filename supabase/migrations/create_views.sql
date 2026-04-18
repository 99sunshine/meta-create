-- Migration: Create views for efficient data fetching
-- Created: 2026-03-20
-- Purpose: Avoid N+1 queries by creating database views with pre-joined data

-- View 1: works_with_creator
-- Joins works table with creator profile information
-- (After works_team_id_unify.sql, recreate view there for optional team JSON.)
CREATE OR REPLACE VIEW works_with_creator AS
SELECT 
  w.*,
  jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'role', p.role,
    'avatar_url', p.avatar_url
  ) as creator
FROM works w
LEFT JOIN profiles p ON w.user_id = p.id;

-- View 2: teams_with_members
-- Joins teams table with aggregated member information
CREATE OR REPLACE VIEW teams_with_members AS
SELECT 
  t.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'role', tm.role,
        'avatar_url', p.avatar_url
      )
      ORDER BY tm.joined_at
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::jsonb
  ) as members,
  COUNT(tm.user_id) as member_count
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN profiles p ON tm.user_id = p.id
GROUP BY t.id;

-- Grant access to authenticated users
GRANT SELECT ON works_with_creator TO authenticated;
GRANT SELECT ON teams_with_members TO authenticated;
