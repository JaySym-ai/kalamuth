-- Enable Realtime for core game entities
-- This allows real-time updates for gladiator health, injuries, and status changes

begin;

-- Add gladiators table to the supabase_realtime publication
alter publication supabase_realtime add table public.gladiators;

-- Set replica identity to full for gladiators to receive old values on UPDATE/DELETE
-- This is useful for tracking health changes, injuries, and recovery progress
alter table public.gladiators replica identity full;

commit;