-- Emergency fix V2 for gladiator visibility
-- This version completely avoids circular RLS dependencies

-- Drop ALL existing SELECT policies on gladiators
DROP POLICY IF EXISTS gladiators_select_own ON public.gladiators;
DROP POLICY IF EXISTS gladiators_select_in_combat ON public.gladiators;

-- Create a simple policy that allows:
-- 1. Users to see their own gladiators
-- 2. Users to see ANY gladiator in a combat match where they have a gladiator
-- This avoids circular dependencies by not querying gladiators table in the policy
CREATE POLICY gladiators_select_in_combat ON public.gladiators
  FOR SELECT
  USING (
    -- User can see their own gladiators
    "userId" = auth.uid()
    OR
    -- User can see gladiators in matches where they are a participant
    -- We check combat_matches table only, no gladiators subquery
    id IN (
      -- Get gladiator1Id from matches where user owns gladiator2
      SELECT cm."gladiator1Id" 
      FROM combat_matches cm
      WHERE cm."gladiator2Id" IN (
        -- Direct check without subquery - use the outer table reference
        SELECT g2.id FROM gladiators g2 WHERE g2."userId" = auth.uid()
      )
      UNION
      -- Get gladiator2Id from matches where user owns gladiator1
      SELECT cm."gladiator2Id"
      FROM combat_matches cm
      WHERE cm."gladiator1Id" IN (
        SELECT g1.id FROM gladiators g1 WHERE g1."userId" = auth.uid()
      )
    )
  );

-- Verify the policy was created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'gladiators' AND cmd = 'SELECT';

