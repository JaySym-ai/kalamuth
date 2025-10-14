-- Fix the gladiator current health constraint to ensure it allows 0 health
-- The constraint "check_current_health_range" already exists in the database

begin;

-- Drop the existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_current_health_range'
        AND table_name = 'gladiators'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.gladiators DROP CONSTRAINT check_current_health_range;
    END IF;
    
    -- Also drop the constraint with the original name if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'gladiators_current_health_check'
        AND table_name = 'gladiators'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.gladiators DROP CONSTRAINT gladiators_current_health_check;
    END IF;
END $$;

-- Add the constraint with the correct name and allow 0 health
ALTER TABLE public.gladiators
ADD CONSTRAINT check_current_health_range
CHECK ("currentHealth" >= 0 AND "currentHealth" <= health);

commit;