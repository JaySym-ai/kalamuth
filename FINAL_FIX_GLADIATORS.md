# 🔧 FINAL FIX: Gladiator Visibility

## The Problem

The RLS policy has a **circular dependency** - it tries to query the `gladiators` table while defining the policy for the `gladiators` table, creating an infinite loop.

## The Solution

Use a **simpler approach**: Allow users to see all gladiators in their server (same as arena queue behavior).

### Run This SQL

**Open Supabase SQL Editor** and run:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS gladiators_select_own ON public.gladiators;
DROP POLICY IF EXISTS gladiators_select_in_combat ON public.gladiators;

-- Create simple policy: users can see gladiators in their server
CREATE POLICY gladiators_select_same_server ON public.gladiators
  FOR SELECT
  USING (
    "userId" = auth.uid()
    OR
    "serverId" IN (
      SELECT l."serverId" 
      FROM ludi l 
      WHERE l."userId" = auth.uid()
    )
  );
```

### Why This Works

1. **No circular dependencies** - Only queries `ludi` table, not `gladiators`
2. **Matches arena behavior** - You already see these gladiators in arena queues
3. **Still secure** - Users can't see gladiators from other servers
4. **Simple and fast** - No complex joins or subqueries

### After Running

1. **Refresh your browser** (Cmd+Shift+R or Ctrl+Shift+R)
2. **Check dashboard** - Your gladiators should appear ✅
3. **Check arena** - Your gladiators should appear in selector ✅
4. **Test combat** - Both gladiators should load ✅

### What You Can See

With this policy:
- ✅ Your own gladiators
- ✅ All gladiators in your server (for combat, queues, etc.)
- ❌ Gladiators from other servers

This is the same visibility as the arena queue system, so it's consistent with the rest of the app.

### Verify It Worked

```sql
-- Should show gladiators_select_same_server
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'gladiators' AND cmd = 'SELECT';
```

### Why the Previous Fix Failed

The previous policy tried to:
```sql
JOIN gladiators g ON ...
WHERE g."userId" = auth.uid()
```

This creates a circular dependency:
- Policy for `gladiators` table queries `gladiators` table
- PostgreSQL blocks this to prevent infinite loops
- Result: No gladiators visible

The new policy only queries the `ludi` table, avoiding the circular dependency entirely.

## Next Steps

After your gladiators are visible:

1. **Test dashboard** - See your gladiators
2. **Test arena** - Queue a gladiator
3. **Test combat** - Start a match and verify both gladiators load
4. **Test battle** - Watch the AI-narrated combat stream

Everything should work perfectly now! 🎉

## Alternative: More Restrictive Policy

If you want to be more restrictive (only show gladiators in active matches), we'd need to use a **security definer function** to avoid circular dependencies. But the server-based approach is simpler and matches your existing arena queue behavior.

Let me know if you want the more restrictive version!

