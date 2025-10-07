# ⚠️ DATABASE MIGRATION REQUIRED

## Issue

If clicking "Entrer dans l'Arène" (Start Combat) redirects you to the dashboard, it means the database migration hasn't been run yet.

## Solution

Run the database migration to add the combat system tables and fields:

```bash
# Option 1: Using Supabase CLI (recommended)
npx supabase db push

# Option 2: Manual migration
npx supabase migration up
```

## What the Migration Does

The migration `0005_combat_system.sql` will:

1. **Extend `combat_matches` table** with:
   - `maxActions` - Maximum actions per battle
   - `actionIntervalSeconds` - Time between actions
   - `deathChancePercent` - Death probability
   - `injuryChancePercent` - Injury probability
   - `winnerId` - Winner gladiator ID
   - `winnerMethod` - How victory was achieved
   - `totalActions` - Actual actions executed
   - `durationSeconds` - Battle duration

2. **Create `combat_logs` table** for:
   - Storing every action during battle
   - Replay capability
   - Bilingual narration (EN/FR)
   - Health snapshots per action

3. **Add indexes** for:
   - Efficient match queries
   - Fast log retrieval
   - Winner lookups

4. **Set up RLS policies** for:
   - User can only read their own match logs
   - Service role can insert logs

## Verify Migration Success

After running the migration, verify it worked:

```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'combat_matches' 
  AND column_name IN ('maxActions', 'winnerId');

-- Check if combat_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'combat_logs';
```

You should see results for both queries.

## After Migration

1. Restart your dev server: `npm run dev`
2. Navigate to an arena
3. Queue two gladiators (from different users)
4. Wait for match creation
5. Click "Entrer dans l'Arène" (Start Combat)
6. You should now see the combat page!

## Still Having Issues?

If you still get redirected after running the migration:

1. **Check server logs** for errors
2. **Verify you have an active match**:
   ```sql
   SELECT * FROM combat_matches 
   WHERE status = 'pending' 
   ORDER BY "matchedAt" DESC 
   LIMIT 5;
   ```
3. **Check if you're a participant**:
   ```sql
   SELECT g.id, g.name, g.surname, g."userId"
   FROM gladiators g
   WHERE g.id IN (
     SELECT "gladiator1Id" FROM combat_matches WHERE status = 'pending'
     UNION
     SELECT "gladiator2Id" FROM combat_matches WHERE status = 'pending'
   );
   ```

## Need Help?

See `docs/BATTLE_SYSTEM_QUICKSTART.md` for a complete testing guide.

