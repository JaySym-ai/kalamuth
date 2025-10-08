-- Ensure both combatants can subscribe to each other's acceptance status

begin;

drop policy if exists "Users can view own match acceptances" on public.combat_match_acceptances;

drop policy if exists "Participants can view match acceptances" on public.combat_match_acceptances;

create policy "Participants can view match acceptances"
  on public.combat_match_acceptances
  for select
  using (
    combat_match_acceptances."userId" = auth.uid()
    or exists (
      select 1
      from public.combat_matches cm
      join public.gladiators g
        on g.id = any(array[cm."gladiator1Id", cm."gladiator2Id"])
      where cm.id = combat_match_acceptances."matchId"
        and g."userId" = auth.uid()
    )
  );

commit;
