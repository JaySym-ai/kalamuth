-- Ensure tavern_gladiators table also has the correct constraint
-- This is for consistency and to prevent similar issues

begin;

-- Drop any existing constraints to avoid conflicts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tavern_gladiators_current_health_check'
        AND table_name = 'tavern_gladiators'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tavern_gladiators DROP CONSTRAINT tavern_gladiators_current_health_check;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tavern_gladiators_current_health_range'
        AND table_name = 'tavern_gladiators'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tavern_gladiators DROP CONSTRAINT tavern_gladiators_current_health_range;
    END IF;
END $$;

-- Add the constraint with a consistent name and allow 0 health
ALTER TABLE public.tavern_gladiators
ADD CONSTRAINT tavern_gladiators_current_health_range
CHECK ("currentHealth" >= 0 AND "currentHealth" <= health);

commit;