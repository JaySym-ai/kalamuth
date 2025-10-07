-- Migration: Allow users to view gladiators in their server
-- This avoids circular RLS dependencies and matches arena queue behavior

-- Drop the old restrictive policy first
DROP POLICY IF EXISTS gladiators_select_own ON public.gladiators;
DROP POLICY IF EXISTS gladiators_select_in_combat ON public.gladiators;

-- Create new policy that allows viewing gladiators in the same server
-- This is simpler, faster, and avoids circular RLS dependencies
-- Users already see these gladiators in arena queues, so this is consistent
CREATE POLICY gladiators_select_same_server ON public.gladiators
  FOR SELECT
  USING (
    -- User can see their own gladiators
    "userId" = auth.uid()
    OR
    -- User can see gladiators in the same server
    -- No circular dependency - only queries ludi table
    "serverId" IN (
      SELECT l."serverId"
      FROM ludi l
      WHERE l."userId" = auth.uid()
    )
  );

