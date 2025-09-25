-- Verification queries for Arena Queue System
-- Run these in Supabase SQL Editor to verify the system is working

-- 1. Check if rankingPoints column exists on gladiators
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'gladiators' 
  AND column_name = 'rankingPoints';
-- Expected: 1 row with default value 1000

-- 2. Check if combat_queue table exists with correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'combat_queue'
ORDER BY ordinal_position;
-- Expected: Multiple rows showing all queue columns

-- 3. Check if combat_matches table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'combat_matches'
ORDER BY ordinal_position;
-- Expected: Multiple rows showing all match columns

-- 4. Verify indexes were created
SELECT 
  indexname, 
  tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    indexname LIKE '%combat_queue%' 
    OR indexname LIKE '%combat_matches%'
    OR indexname = 'idx_gladiators_ranking'
  )
ORDER BY tablename, indexname;
-- Expected: Multiple indexes for queue, matches, and ranking

-- 5. Check RLS policies
SELECT 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('combat_queue', 'combat_matches')
ORDER BY tablename, policyname;
-- Expected: Policies for select, insert, update, delete

-- 6. Sample data check - view all gladiators with ranking points
SELECT 
  id,
  name,
  surname,
  "rankingPoints",
  alive,
  injury IS NOT NULL as is_injured,
  sickness IS NOT NULL as is_sick
FROM gladiators
ORDER BY "rankingPoints" DESC
LIMIT 10;
-- Expected: All gladiators should have rankingPoints (default 1000)

-- 7. View current queue state (if any)
SELECT 
  cq.id,
  cq."arenaSlug",
  cq."serverId",
  g.name || ' ' || g.surname as gladiator_name,
  cq."rankingPoints",
  cq.status,
  cq."queuedAt",
  cq."matchId"
FROM combat_queue cq
LEFT JOIN gladiators g ON g.id = cq."gladiatorId"
ORDER BY cq."queuedAt";
-- Expected: Empty or shows current queue entries

-- 8. View active matches (if any)
SELECT 
  cm.id,
  cm."arenaSlug",
  cm."serverId",
  g1.name || ' ' || g1.surname as gladiator1,
  g2.name || ' ' || g2.surname as gladiator2,
  cm.status,
  cm."matchedAt"
FROM combat_matches cm
LEFT JOIN gladiators g1 ON g1.id = cm."gladiator1Id"
LEFT JOIN gladiators g2 ON g2.id = cm."gladiator2Id"
WHERE cm.status IN ('pending', 'in_progress')
ORDER BY cm."matchedAt" DESC;
-- Expected: Empty or shows active matches

-- 9. Test data cleanup (use if needed during development)
-- CAUTION: This deletes all queue and match data
-- DELETE FROM combat_matches;
-- DELETE FROM combat_queue;

-- 10. Update all existing gladiators to have ranking points (if migration didn't set defaults)
-- UPDATE gladiators SET "rankingPoints" = 1000 WHERE "rankingPoints" IS NULL;
