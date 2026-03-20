# Database Views Setup Instructions

## Overview
The MetaCreate explore feed uses database views to efficiently fetch joined data without N+1 query problems. This document explains how to create the required views in Supabase.

## Required Views

### 1. works_with_creator
This view joins the `works` table with creator profile information from the `profiles` table.

### 2. teams_with_members
This view joins the `teams` table with aggregated member information from `team_members` and `profiles` tables.

## How to Execute the SQL

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard:
   https://supabase.com/dashboard/project/ottxbqqaaxmrtrwtowdv

2. Navigate to **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy and paste the SQL from `supabase/migrations/create_views.sql`

5. Click **Run** or press `Ctrl+Enter`

6. Verify the views were created by running:
   ```sql
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public' 
   AND table_name IN ('works_with_creator', 'teams_with_members');
   ```

### Option 2: Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
supabase db push
```

This will execute all migrations in the `supabase/migrations/` directory.

## After Creating Views

Once the views are created, you should regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id ottxbqqaaxmrtrwtowdv > types/supabase.ts
```

This will update the types to include the new views in the `Database['public']['Views']` section.

## Verifying the Implementation

After creating the views:

1. The app should automatically start fetching data from the database
2. The community feed will show empty state if there are no works/teams yet
3. You can test by creating works or teams in Supabase directly
4. Check browser console for any errors in data fetching

## Troubleshooting

### "relation does not exist" error
- The views haven't been created yet. Execute the SQL in Supabase dashboard.

### "permission denied" error
- Make sure the GRANT statements in the SQL migration are executed
- Check RLS policies on the base tables (works, teams, profiles, team_members)

### Empty feed with no errors
- Check that there is actual data in the works and teams tables
- Verify that the profiles table has corresponding user records
- Check browser network tab for successful API calls

## Architecture Benefits

- **No N+1 Queries**: All joins happen at the database level
- **Type Safe**: TypeScript types are generated from the views
- **Scalable**: Database handles joins efficiently with proper indexing
- **Maintainable**: Single source of truth for joined data structure
