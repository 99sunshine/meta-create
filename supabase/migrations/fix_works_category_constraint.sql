-- Check and fix works category constraint
-- Run this in Supabase SQL Editor

-- 1. Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'works'::regclass 
AND conname = 'works_category_check';

-- 2. Drop old constraint if it exists
ALTER TABLE works DROP CONSTRAINT IF EXISTS works_category_check;

-- 3. Create correct constraint matching our code
ALTER TABLE works ADD CONSTRAINT works_category_check 
CHECK (category IN ('Engineering', 'Design', 'Art', 'Science', 'Business', 'Other'));

-- 4. Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'works'::regclass 
AND conname = 'works_category_check';
