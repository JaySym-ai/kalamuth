# Apply Arena Queue Migration

This migration adds the combat queue system to the database.

## What it does:
1. Adds `rankingPoints` column to `gladiators` table (default: 1000)
2. Creates `combat_queue` table for tracking gladiators waiting for matches
3. Creates `combat_matches` table for tracking matched pairs
4. Sets up indexes and RLS policies

## How to apply:

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/0004_arena_queue_system.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI (if configured)
```bash
supabase db push
```

### Option 3: Direct SQL execution
If you have direct database access, run:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/0004_arena_queue_system.sql
```

## Verification:
After applying, verify the migration worked:

```sql
-- Check rankingPoints column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'gladiators' AND column_name = 'rankingPoints';

-- Check combat_queue table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'combat_queue';

-- Check combat_matches table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'combat_matches';
```

## Rollback (if needed):
```sql
BEGIN;
DROP TABLE IF EXISTS public.combat_matches CASCADE;
DROP TABLE IF EXISTS public.combat_queue CASCADE;
ALTER TABLE public.gladiators DROP COLUMN IF EXISTS "rankingPoints";
COMMIT;
```
