-- Reinforce visibility of match acceptance records for both participants

begin;

drop policy if exists "Participants can view match acceptances" on public.combat_match_acceptances;

create policy "Participants can view match acceptances"
  on public.combat_match_acceptances
  for select
  using (
    -- Always allow the record owner to view their acceptance
    combat_match_acceptances."userId" = auth.uid()
    or exists (
      -- Allow viewing other acceptances for matches the user participates in
      select 1
      from public.combat_match_acceptances cma
      where cma."matchId" = combat_match_acceptances."matchId"
        and cma."userId" = auth.uid()
    )
  );

commit;
