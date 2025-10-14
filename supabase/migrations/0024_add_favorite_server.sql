-- Add favoriteServerId to users table to track which server is the user's favorite
alter table public.users
add column "favoriteServerId" text;

-- Add comment for clarity
comment on column public.users."favoriteServerId" is 'The server ID of the user''s favorite ludus. Used to determine which ludus to load on dashboard.';

