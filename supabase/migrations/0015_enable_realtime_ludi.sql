-- Enable Realtime for Ludus management
-- This allows real-time updates for treasury changes, reputation, and facility upgrades

begin;

-- Add ludi table to the supabase_realtime publication
alter publication supabase_realtime add table public.ludi;

-- Set replica identity to full for ludi to receive old values on UPDATE/DELETE
-- This is useful for tracking treasury changes, reputation updates, and facility improvements
alter table public.ludi replica identity full;

commit;