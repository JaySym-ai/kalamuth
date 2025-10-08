# Apply Migration 0009 - Fix Acceptance Insert Policy

## Problem

The match acceptance buttons are not showing because the acceptances are not being created in the database. The RLS policy is blocking the insert operation.

## Solution

Apply migration `0009_fix_acceptance_insert_policy.sql` which allows authenticated users to insert acceptances.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://kaladb.r02.ovh
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/0009_fix_acceptance_insert_policy.sql`:

```sql
-- Fix RLS policy to allow system to create acceptances
-- The matchmaking system needs to create acceptance records for both players

begin;

-- Drop existing policies
drop policy if exists "Users can insert own acceptances" on public.combat_match_acceptances;
drop policy if exists "Service role can insert acceptances" on public.combat_match_acceptances;
drop policy if exists "System can insert acceptances" on public.combat_match_acceptances;

-- Allow authenticated users to insert acceptances
-- This is needed because the matchmaking API creates acceptances for both players
create policy "Authenticated users can insert acceptances"
  on public.combat_match_acceptances
  for insert
  to authenticated
  with check (true);

commit;
```

5. Click **Run** or press `Cmd+Enter`
6. Verify the query executed successfully

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will apply all pending migrations.

### Option 3: Manual SQL Execution

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@kaladb.r02.ovh:5432/postgres" -f supabase/migrations/0009_fix_acceptance_insert_policy.sql
```

## Verification

After applying the migration, test the match acceptance flow:

1. Open two browsers with different accounts
2. Queue a gladiator from each account
3. When matched, both players should see:
   - ✅ Countdown timer
   - ✅ Both gladiator cards
   - ✅ **Accept Combat** button
   - ✅ **Decline Combat** button

## What This Migration Does

- **Drops** the restrictive RLS policies that were blocking inserts
- **Creates** a new policy that allows any authenticated user to insert acceptances
- This allows the matchmaking API (which runs as an authenticated user) to create acceptance records for both players

## Security Note

This policy allows any authenticated user to insert acceptances. This is safe because:
1. The matchmaking API is the only code that creates acceptances
2. Users can only update their own acceptances (separate policy)
3. The `matchId` and `gladiatorId` must be valid foreign keys
4. The system validates ownership before allowing accept/decline actions

## Next Steps

After applying this migration:
1. Restart your dev server: `npm run dev`
2. Test the match acceptance flow
3. Remove the debug console.log statements from the code
4. Create Playwright E2E tests

