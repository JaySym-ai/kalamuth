-- Simple fix for gladiator visibility
-- Allow users to see all gladiators in their server (same as arena queue logic)

-- Drop ALL existing SELECT policies on gladiators
DROP POLICY IF EXISTS gladiators_select_own ON public.gladiators;
DROP POLICY IF EXISTS gladiators_select_in_combat ON public.gladiators;

-- Create a simple policy: users can see gladiators in their server
-- This matches the arena queue behavior and avoids circular dependencies
CREATE POLICY gladiators_select_same_server ON public.gladiators
  FOR SELECT
  USING (
    -- User can see their own gladiators
    "userId" = auth.uid()
    OR
    -- User can see gladiators in the same server
    -- This is safe because users already see these gladiators in arena queues
    "serverId" IN (
      SELECT l."serverId" 
      FROM ludi l 
      WHERE l."userId" = auth.uid()
    )
  );

-- Verify the policy was created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'gladiators' AND cmd = 'SELECT';

