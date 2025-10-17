# Fix Combat Match Acceptances RLS Recursion

## Problem
The `combat_match_acceptances` table has infinite recursion in its RLS policies, causing this error:
```
Error fetching acceptances: {
  code: '42P17',
  message: 'infinite recursion detected in policy for relation "combat_match_acceptances"'
}
```

This happens when the RLS policies create circular dependencies through complex joins.

## Solution
This migration replaces the complex RLS policies with simpler, non-recursive ones that achieve the same security goals.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/0013_fix_infinite_recursion_final.sql`
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
  AND tablename = 'combat_match_acceptances'
ORDER BY policyname;
```

You should see:
- `Users can view match acceptances` (SELECT)
- `Users can insert own acceptances` (INSERT)
- `Users can update own acceptances` (UPDATE)
- `Service role full access` (ALL)

## Test the Fix

After applying the migration:
1. Go to your arena page
2. Queue a gladiator
3. When a match is found, you should see the acceptance panel immediately
4. Try accepting/declining the match
5. Check the browser console - no more "42P17" errors
6. The fallback polling should work as a backup

## What Changed

**Before (Causing Recursion):**
- Complex SELECT policy with nested EXISTS clauses
- Circular references between combat_match_acceptances, combat_matches, and gladiators
- Multiple overlapping policies

**After (Fixed):**
- Simplified SELECT policy using IN subqueries instead of EXISTS
- Clear separation of concerns between different policy types
- Service role policy for system operations

## Security Note

The new policies maintain the same security level:
- Users can only see acceptances for matches they participate in
- Users can only insert/update their own acceptances
- Service role has full access for system operations

The fix uses IN subqueries instead of EXISTS to avoid the recursion issue while maintaining the same security boundaries.