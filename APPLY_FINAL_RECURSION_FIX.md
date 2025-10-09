# FINAL FIX: Combat Match Acceptances Infinite Recursion

## Problem
The `combat_match_acceptances` table has infinite recursion in its RLS policies, causing:
```
Error: {
  code: '42P17',
  message: 'infinite recursion detected in policy for relation "combat_match_acceptances"'
}
```

## Root Cause
Multiple conflicting policies in migrations 0012 created circular references through complex EXISTS clauses.

## Solution
Apply the consolidated migration that replaces ALL policies with a non-recursive approach.

## How to Apply

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**

### Step 2: Apply the Fix
1. Copy the entire contents of `supabase/migrations/0013_fix_infinite_recursion_final.sql`
2. Paste into the SQL Editor
3. Click **Run**
4. You should see "Success. No rows returned"

### Step 3: Verify the Fix
Run this query in the SQL Editor:

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

You should see exactly these 4 policies:
- `Service role full access` (ALL)
- `Users can insert own acceptances` (INSERT) 
- `Users can update own acceptances` (UPDATE)
- `Users can view match acceptances` (SELECT)

## Test the Fix

1. Go to your arena page
2. Queue a gladiator for matchmaking
3. When a match is found, the acceptance panel should appear immediately
4. Try accepting/declining the match
5. Check browser console - NO MORE "42P17" errors should appear

## What This Fixes

**Before (Broken):**
- Multiple overlapping policies causing circular references
- EXISTS clauses creating infinite loops
- Users unable to view match acceptances

**After (Fixed):**
- Single comprehensive SELECT policy using IN subqueries
- Clean separation of concerns for INSERT/UPDATE operations  
- Service role bypass for system operations
- Same security level, no recursion

## Security Maintained
- Users only see acceptances for matches they participate in
- Users only modify their own acceptances  
- Service role has full access for automated systems

The fix uses IN subqueries instead of EXISTS to eliminate recursion while preserving all security boundaries.