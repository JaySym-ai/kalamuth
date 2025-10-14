-- Add currentHealth column to gladiators table
-- This will track the current health of each gladiator separately from their max health

begin;

ALTER TABLE public.gladiators
ADD COLUMN if not exists "currentHealth" INTEGER;

-- Set currentHealth to match the existing health value for all existing gladiators
UPDATE public.gladiators
SET "currentHealth" = health
WHERE "currentHealth" is null;

-- Add NOT NULL constraint after populating existing rows
ALTER TABLE public.gladiators
ALTER COLUMN "currentHealth" SET NOT NULL;

-- Add check constraint to ensure currentHealth is between 0 and health
ALTER TABLE public.gladiators
ADD CONSTRAINT gladiators_current_health_check
CHECK ("currentHealth" >= 0 AND "currentHealth" <= health);

commit;