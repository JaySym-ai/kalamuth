-- Add currentHealth column to tavern_gladiators table
-- This tracks the current health of tavern gladiators (can be less than max health)

begin;

alter table public.tavern_gladiators
add column if not exists "currentHealth" int;

-- Set currentHealth to equal health for existing rows
update public.tavern_gladiators
set "currentHealth" = health
where "currentHealth" is null;

-- Add NOT NULL constraint after populating existing rows
alter table public.tavern_gladiators
alter column "currentHealth" set not null;

-- Add check constraint to ensure currentHealth is valid
alter table public.tavern_gladiators
add constraint tavern_gladiators_current_health_check check ("currentHealth" >= 0 and "currentHealth" <= health);

commit;

