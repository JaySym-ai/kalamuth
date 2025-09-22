-- Extend gladiators schema to support generation payload (alive + narrative/condition fields)
-- and enable bilingual-capable JSONB storage where appropriate.

begin;

-- Vital status
alter table public.gladiators
  add column if not exists alive boolean not null default true;

-- Conditions
alter table public.gladiators
  add column if not exists injury jsonb,
  add column if not exists "injuryTimeLeftHours" integer,
  add column if not exists sickness jsonb;

-- Narrative / attributes (bilingual-capable)
alter table public.gladiators
  add column if not exists handicap jsonb,
  add column if not exists "uniquePower" jsonb,
  add column if not exists weakness jsonb,
  add column if not exists fear jsonb,
  add column if not exists "physicalCondition" jsonb,
  add column if not exists "notableHistory" jsonb;

-- Convert existing text columns to jsonb to support bilingual content while remaining
-- backward compatible with single-string storage.
-- Only convert when the current type is not already jsonb.

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'gladiators' and column_name = 'lifeGoal' and data_type <> 'jsonb'
  ) then
    alter table public.gladiators
      alter column "lifeGoal" type jsonb using to_jsonb("lifeGoal");
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'gladiators' and column_name = 'backstory' and data_type <> 'jsonb'
  ) then
    alter table public.gladiators
      alter column backstory type jsonb using to_jsonb(backstory);
  end if;
end $$;

commit;

