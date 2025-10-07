# Fix: Gladiator Visibility in Combat

## Problem

When trying to view a combat match, you get the error:
```
Combat page - Could not load both gladiators: 1
```

This happens because the current RLS (Row Level Security) policy only allows users to see their own gladiators, blocking access to opponent gladiators in combat matches.

## Solution

Run the new migration to update the RLS policy:

```bash
npx supabase db push
```

Or:

```bash
npx supabase migration up
```

## What This Migration Does

The migration `0006_gladiator_combat_visibility.sql` will:

1. **Drop the old restrictive policy** (`gladiators_select_own`)
2. **Create a new policy** (`gladiators_select_in_combat`) that allows:
   - Users to see their own gladiators (as before)
   - Users to see opponent gladiators in their combat matches

## How It Works

The new policy allows you to see a gladiator if:
- You own the gladiator (`userId = auth.uid()`), OR
- The gladiator is matched against one of your gladiators in a combat match

This means:
- ✅ You can see your own gladiators
- ✅ You can see opponent gladiators in your active matches
- ❌ You cannot see random gladiators from other users
- ❌ You cannot see gladiators you're not matched against

## After Migration

1. **Restart your dev server**: `npm run dev`
2. **Navigate to your combat match**: Click "Entrer dans l'Arène"
3. **Combat page should load** with both gladiators visible
4. **Start the battle!**

## Verify It Worked

After running the migration, check the policies:

```sql
-- List all policies on gladiators table
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'gladiators';
```

You should see:
- `gladiators_select_in_combat` (SELECT)
- `gladiators_insert_self` (INSERT)
- `gladiators_update_own` (UPDATE)
- `gladiators_delete_own` (DELETE)

## Still Having Issues?

If you still get the error after migration:

1. **Check the match exists**:
   ```sql
   SELECT * FROM combat_matches 
   WHERE id = 'your-match-id';
   ```

2. **Check both gladiators exist**:
   ```sql
   SELECT id, name, surname, "userId" 
   FROM gladiators 
   WHERE id IN ('gladiator1-id', 'gladiator2-id');
   ```

3. **Check you're a participant**:
   ```sql
   SELECT g.id, g.name, g."userId"
   FROM gladiators g
   WHERE g.id IN (
     SELECT "gladiator1Id" FROM combat_matches WHERE id = 'your-match-id'
     UNION
     SELECT "gladiator2Id" FROM combat_matches WHERE id = 'your-match-id'
   );
   ```

## Security Note

This policy is secure because:
- Users can only see gladiators they're actively matched against
- The policy checks the `combat_matches` table to verify the relationship
- Users cannot query arbitrary gladiators
- The policy respects the combat system's matchmaking

Once this migration is applied, the combat system will work correctly! 🎉

