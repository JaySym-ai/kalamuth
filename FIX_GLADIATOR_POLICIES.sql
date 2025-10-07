-- Emergency fix for gladiator visibility
-- Run this if you can't see your gladiators after migration

-- First, check what policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'gladiators';

-- Drop ALL existing SELECT policies on gladiators
DROP POLICY IF EXISTS gladiators_select_own ON public.gladiators;
DROP POLICY IF EXISTS gladiators_select_in_combat ON public.gladiators;

-- Create the correct policy that allows:
-- 1. Users to see their own gladiators
-- 2. Users to see opponent gladiators in their combat matches
-- Note: Uses EXISTS to avoid circular RLS dependencies
CREATE POLICY gladiators_select_in_combat ON public.gladiators
  FOR SELECT
  USING (
    -- User can see their own gladiators
    "userId" = auth.uid()
    OR
    -- User can see opponent gladiators in their combat matches
    -- Check if this gladiator is matched against any of the user's gladiators
    EXISTS (
      SELECT 1 FROM combat_matches cm
      INNER JOIN gladiators g ON (g.id = cm."gladiator1Id" OR g.id = cm."gladiator2Id")
      WHERE g."userId" = auth.uid()
        AND (cm."gladiator1Id" = gladiators.id OR cm."gladiator2Id" = gladiators.id)
        AND cm."gladiator1Id" != cm."gladiator2Id"
    )
  );

-- Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'gladiators';

