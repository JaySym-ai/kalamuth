-- Add rarity column to gladiators table
-- Rarity levels: bad, common, uncommon, rare, epic, legendary, unique

begin;

-- Add rarity column to gladiators table
alter table public.gladiators
add column rarity text not null default 'common';

-- Add constraint to ensure valid rarity values
alter table public.gladiators
add constraint gladiators_rarity_check check (
  rarity in ('bad', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'unique')
);

-- Add rarity column to tavern_gladiators table
alter table public.tavern_gladiators
add column rarity text not null default 'common';

-- Add constraint to ensure valid rarity values
alter table public.tavern_gladiators
add constraint tavern_gladiators_rarity_check check (
  rarity in ('bad', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'unique')
);

commit;

