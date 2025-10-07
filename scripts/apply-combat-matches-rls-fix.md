# Fix Combat Matches RLS Policy

## Problem
The `combat_matches` table has RLS enabled but is missing an INSERT policy, causing this error:
```
Error creating match: {
  code: '42501',
  message: 'new row violates row-level security policy for table "combat_matches"'
}
```

## Solution
This migration adds the missing INSERT and UPDATE policies for the `combat_matches` table.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/0006_fix_combat_matches_rls.sql`
4. Paste and run the SQL
5. You should see "Success. No rows returned"

### Option 2: Supabase CLI (if configured)
```bash
supabase db push
```

## Verify the Fix

Run this query in the SQL Editor to verify the policies were created:

```sql
SELECT 
  tablename, 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'combat_matches'
ORDER BY policyname;
```

You should see:
- `combat_matches_insert_authenticated` (INSERT)
- `combat_matches_select_all` (SELECT)
- `combat_matches_update_authenticated` (UPDATE)

## Test the Fix

After applying the migration:
1. Go to your arena page
2. Queue a gladiator
3. Queue a second gladiator (from a different ludus/user if possible)
4. The matchmaking should now work without RLS errors
5. Check the browser console and server logs - no more "42501" errors

## What Changed

**Before:**
- ✅ SELECT policy existed (users can view all matches)
- ❌ INSERT policy missing (API couldn't create matches)
- ❌ UPDATE policy missing (couldn't update match status)

**After:**
- ✅ SELECT policy (users can view all matches)
- ✅ INSERT policy (authenticated users can create matches)
- ✅ UPDATE policy (authenticated users can update match status)

## Security Note

The INSERT policy allows any authenticated user to create matches. This is safe because:
1. The API validates gladiator ownership before queueing
2. The matchmaking logic only pairs gladiators from different users/ludi
3. The API is the only entry point for match creation (not exposed to direct client calls)

If you want stricter security, you could:
- Create a service role key for the API
- Use the service role to bypass RLS for match creation
- Keep RLS policies restrictive for regular users

But for now, the current approach is simpler and sufficient.

