-- Enable Realtime for combat queue and matches tables
-- This allows real-time updates when gladiators join/leave queues

begin;

-- Add combat_queue table to the supabase_realtime publication
alter publication supabase_realtime add table public.combat_queue;

-- Add combat_matches table to the supabase_realtime publication
alter publication supabase_realtime add table public.combat_matches;

-- Set replica identity to full for combat_queue to receive old values on UPDATE/DELETE
-- This is useful for tracking queue changes
alter table public.combat_queue replica identity full;

-- Set replica identity to full for combat_matches
alter table public.combat_matches replica identity full;

commit;
