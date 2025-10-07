-- Fix RLS policy for combat_matches table
-- The original migration enabled RLS but didn't create an INSERT policy,
-- causing "new row violates row-level security policy" errors when the API
-- tries to create matches during matchmaking.

begin;

-- Allow authenticated users to insert matches
-- This is needed for the matchmaking API endpoint to create matches
-- The API validates that both gladiators exist and belong to users on the same server
create policy combat_matches_insert_authenticated on public.combat_matches for insert
  to authenticated
  with check (true);

-- Optional: Add UPDATE policy for match status changes (e.g., starting/completing matches)
create policy combat_matches_update_authenticated on public.combat_matches for update
  to authenticated
  using (true)
  with check (true);

commit;

