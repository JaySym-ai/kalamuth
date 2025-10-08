-- Enable realtime for combat_match_acceptances table
-- This allows the UI to receive real-time updates when acceptances change

begin;

-- Add the table to the realtime publication
alter publication supabase_realtime add table public.combat_match_acceptances;

commit;

