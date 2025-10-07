# 🚨 URGENT FIX: Can't See Gladiators

## Problem
After running the migration, you can't see your gladiators in the dashboard or arena.

## Quick Fix

### Option 1: Run SQL Script (Fastest)

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click "SQL Editor" in the left sidebar
4. Copy and paste the contents of `FIX_GLADIATOR_POLICIES.sql`
5. Click "Run"

### Option 2: Manual SQL Commands

Run these commands in Supabase SQL Editor:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS gladiators_select_own ON public.gladiators;
DROP POLICY IF EXISTS gladiators_select_in_combat ON public.gladiators;

-- Create correct policy (avoids circular RLS dependencies)
CREATE POLICY gladiators_select_in_combat ON public.gladiators
  FOR SELECT
  USING (
    "userId" = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM combat_matches cm
      INNER JOIN gladiators g ON (g.id = cm."gladiator1Id" OR g.id = cm."gladiator2Id")
      WHERE g."userId" = auth.uid()
        AND (cm."gladiator1Id" = gladiators.id OR cm."gladiator2Id" = gladiators.id)
        AND cm."gladiator1Id" != cm."gladiator2Id"
    )
  );
```

### Option 3: Reset and Reapply Migrations

If the above doesn't work:

```bash
# Reset the database (WARNING: This will delete all data!)
npx supabase db reset

# Or just reapply migrations
npx supabase db push --force
```

## Verify It's Fixed

After running the fix, check:

```sql
-- Should return 1 row with gladiators_select_in_combat
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'gladiators' 
  AND cmd = 'SELECT';
```

Then refresh your browser and check:
- ✅ Dashboard shows your gladiators
- ✅ Arena shows your gladiators
- ✅ You can select gladiators to queue

## Why This Happened

The original migration had a **circular RLS dependency**:
- The policy tried to check `SELECT id FROM gladiators WHERE "userId" = auth.uid()`
- But that SELECT triggers RLS again on the gladiators table
- This creates an infinite loop or blocks access entirely

The fix uses `EXISTS` with a JOIN instead of a subquery, which avoids the circular dependency and allows PostgreSQL to properly evaluate the policy.

## After Fix

1. **Refresh your browser** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. **Navigate to dashboard**: You should see your gladiators
3. **Navigate to arena**: You should see your gladiators in the selector
4. **Test combat**: Queue and start a match

## Still Not Working?

If you still can't see gladiators:

1. **Check if gladiators exist**:
   ```sql
   SELECT id, name, surname, "userId" 
   FROM gladiators 
   WHERE "userId" = auth.uid();
   ```

2. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'gladiators';
   ```
   Should show `rowsecurity = true`

3. **Check your user ID**:
   ```sql
   SELECT auth.uid();
   ```
   Should return your user UUID

4. **Temporarily disable RLS** (for testing only):
   ```sql
   ALTER TABLE gladiators DISABLE ROW LEVEL SECURITY;
   ```
   If gladiators appear, the issue is with the policy.
   
   **Re-enable RLS after testing**:
   ```sql
   ALTER TABLE gladiators ENABLE ROW LEVEL SECURITY;
   ```

## Contact

If none of these work, there might be a deeper issue. Check:
- Server logs for errors
- Browser console for errors
- Network tab for failed requests

The gladiators are still in the database, they're just hidden by RLS. The fix above will restore visibility! 🔧

