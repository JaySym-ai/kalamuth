-- FINAL FIX: Infinite recursion in combat_match_acceptances RLS policies
-- This replaces ALL existing policies with a non-recursive approach

begin;

-- Drop ALL existing policies to start fresh
drop policy if exists "Users can view match acceptances" on public.combat_match_acceptances;
drop policy if exists "Participants can view match acceptances" on public.combat_match_acceptances;
drop policy if exists "Users can insert own acceptances" on public.combat_match_acceptances;
drop policy if exists "Users can update own acceptances" on public.combat_match_acceptances;
drop policy if exists "Service role full access" on public.combat_match_acceptances;
drop policy if exists "Authenticated users can insert acceptances" on public.combat_match_acceptances;
drop policy if exists "System can insert acceptances" on public.combat_match_acceptances;

-- Simplified select policy using IN subqueries to avoid recursion
create policy "Users can view match acceptances"
  on public.combat_match_acceptances
  for select
  using (
    -- Users can see their own acceptances
    combat_match_acceptances."userId" = auth.uid()
    -- OR users can see acceptances for matches where they are a gladiator
    or combat_match_acceptances."matchId" in (
      select cm.id
      from public.combat_matches cm
      where cm."gladiator1Id" in (
        select g.id from public.gladiators g where g."userId" = auth.uid()
      )
      or cm."gladiator2Id" in (
        select g.id from public.gladiators g where g."userId" = auth.uid()
      )
    )
  );

-- Allow users to insert their own acceptances
create policy "Users can insert own acceptances"
  on public.combat_match_acceptances
  for insert
  with check ("userId" = auth.uid());

-- Allow users to update their own acceptances
create policy "Users can update own acceptances"
  on public.combat_match_acceptances
  for update
  using ("userId" = auth.uid())
  with check ("userId" = auth.uid());

-- Allow service role full access for system operations
create policy "Service role full access"
  on public.combat_match_acceptances
  for all
  to service_role
  using (true)
  with check (true);

commit;