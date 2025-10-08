-- Fix RLS policy to allow system to create acceptances
-- The matchmaking system needs to create acceptance records for both players

begin;

-- Drop existing policies
drop policy if exists "Users can insert own acceptances" on public.combat_match_acceptances;
drop policy if exists "Service role can insert acceptances" on public.combat_match_acceptances;
drop policy if exists "System can insert acceptances" on public.combat_match_acceptances;

-- Allow authenticated users to insert acceptances
-- This is needed because the matchmaking API creates acceptances for both players
create policy "Authenticated users can insert acceptances"
  on public.combat_match_acceptances
  for insert
  to authenticated
  with check (true);

commit;

