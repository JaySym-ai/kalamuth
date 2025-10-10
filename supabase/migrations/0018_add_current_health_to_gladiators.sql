-- Add currentHealth column to gladiators table
-- This will track the current health of each gladiator separately from their max health

ALTER TABLE gladiators 
ADD COLUMN current_health INTEGER NOT NULL DEFAULT 100;

-- Set current_health to match the existing health value for all existing gladiators
UPDATE gladiators 
SET current_health = health 
WHERE current_health = 100;

-- Add check constraint to ensure current_health is between 0 and health
ALTER TABLE gladiators 
ADD CONSTRAINT check_current_health_range 
CHECK (current_health >= 0 AND current_health <= health);

-- Add comment to explain the difference between health and current_health
COMMENT ON COLUMN gladiators.health IS 'Maximum health capacity (HP cap) for this gladiator';
COMMENT ON COLUMN gladiators.current_health IS 'Current health points - may be reduced by combat/injury and restored by healing';