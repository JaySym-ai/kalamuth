-- Enable Realtime for Users table
-- This allows real-time updates for user status and onboarding changes

begin;

-- Add users table to the supabase_realtime publication
alter publication supabase_realtime add table public.users;

-- Set replica identity to full for users to receive old values on UPDATE/DELETE
-- This is useful for tracking onboarding progress and user status changes
alter table public.users replica identity full;

commit;