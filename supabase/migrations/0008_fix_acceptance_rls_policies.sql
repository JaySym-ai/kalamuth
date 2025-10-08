-- Fix RLS policies for combat_match_acceptances
-- Allow users to insert their own acceptances

begin;

-- Drop the existing system-only insert policy
drop policy if exists "System can insert acceptances" on public.combat_match_acceptances;

-- Create a new policy that allows users to insert their own acceptances
create policy "Users can insert own acceptances"
  on public.combat_match_acceptances
  for insert
  with check ("userId" = auth.uid());

-- Keep the system policy for service role operations
create policy "Service role can insert acceptances"
  on public.combat_match_acceptances
  for insert
  with check (false); -- Disabled for regular users, only for service role

commit;