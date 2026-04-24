# Fix RLS Policies for Create Operations

## Issue
Getting error: "new row violates row-level security policy for table teams"

This happens because Supabase RLS (Row Level Security) is blocking insert operations on the teams and works tables.

## Solution
Run the SQL in `supabase/migrations/rls_policies_create.sql` in your Supabase SQL Editor.

## Steps to Fix

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/ottxbqqaaxmrtrwtowdv

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Run the SQL**
   - Copy the contents of `supabase/migrations/rls_policies_create.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Policies**
   - The SQL includes a verification query at the end
   - Check that policies were created for `teams`, `team_members`, and `works` tables

## What the Policies Do

### Teams Table
- ✅ Allow users to CREATE teams (they must be the owner)
- ✅ Allow users to VIEW their own teams
- ✅ Allow users to VIEW all open/public teams
- ✅ Allow team owners to UPDATE their teams

### Team Members Table
- ✅ Allow users to JOIN teams (insert themselves or be added by owner)
- ✅ Allow everyone to VIEW team members
- ✅ Allow users to LEAVE teams

### Works Table
- ✅ Allow users to CREATE works
- ✅ Allow everyone to VIEW all works (public)
- ✅ Allow users to UPDATE their own works
- ✅ Allow users to DELETE their own works

## After Running SQL

1. Refresh your app at http://localhost:3000/main
2. Try creating a team again
3. It should work without RLS errors

## Troubleshooting

If you still get RLS errors after running the SQL:

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('teams', 'team_members', 'works');
   ```

2. **Drop existing conflicting policies (if any):**
   ```sql
   DROP POLICY IF EXISTS "Users can create teams" ON teams;
   DROP POLICY IF EXISTS "Users can create works" ON works;
   ```
   Then re-run the policy creation SQL.

3. **Verify user authentication:**
   - Make sure you're logged in
   - Check that `auth.uid()` matches your user ID:
   ```sql
   SELECT auth.uid();
   ```
