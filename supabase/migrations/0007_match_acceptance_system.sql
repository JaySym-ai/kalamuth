-- Match acceptance system
-- Adds mutual acceptance requirement for combat matches with 1-minute timeout

begin;

-- Create match acceptances table to track individual player responses
create table if not exists public.combat_match_acceptances (
  id uuid primary key default gen_random_uuid(),
  
  -- Match reference
  "matchId" uuid not null references public.combat_matches(id) on delete cascade,
  
  -- Gladiator and user who needs to respond
  "gladiatorId" uuid not null references public.gladiators(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  
  -- Response status
  "status" text not null default 'pending' check ("status" in ('pending', 'accepted', 'declined')),
  
  -- Response timestamp
  "respondedAt" timestamptz,
  
  -- When this acceptance was created
  "createdAt" timestamptz not null default now(),
  
  -- Ensure one acceptance per gladiator per match
  unique ("matchId", "gladiatorId")
);

-- Add acceptance deadline to combat_matches table
alter table public.combat_matches
  add column if not exists "acceptanceDeadline" timestamptz;

-- Update existing matches to use new status
-- First, add the new status value to the check constraint if needed
alter table public.combat_matches alter column "status" type text;
alter table public.combat_matches add constraint combat_matches_status_check 
  check ("status" in ('pending_acceptance', 'pending', 'in_progress', 'completed', 'cancelled'));

-- Update existing pending matches to pending_acceptance status
update public.combat_matches 
set "status" = 'pending_acceptance' 
where "status" = 'pending';

-- Create indexes for efficient queries
create index if not exists idx_combat_match_acceptances_match on public.combat_match_acceptances("matchId");
create index if not exists idx_combat_match_acceptances_gladiator on public.combat_match_acceptances("gladiatorId");
create index if not exists idx_combat_match_acceptances_user on public.combat_match_acceptances("userId");
create index if not exists idx_combat_match_acceptances_status on public.combat_match_acceptances("status");
create index if not exists idx_combat_match_acceptances_created on public.combat_match_acceptances("createdAt");

create index if not exists idx_combat_matches_acceptance_deadline on public.combat_matches("acceptanceDeadline");
create index if not exists idx_combat_matches_status_updated on public.combat_matches("status", "matchedAt");

-- Enable RLS on combat_match_acceptances
alter table public.combat_match_acceptances enable row level security;

-- RLS Policies for combat_match_acceptances
-- Users can view acceptances for their own matches
create policy "Users can view own match acceptances"
  on public.combat_match_acceptances
  for select
  using ("userId" = auth.uid());

-- Users can update their own acceptances
create policy "Users can update own acceptances"
  on public.combat_match_acceptances
  for update
  using ("userId" = auth.uid());

-- Users can insert their own acceptances
create policy "Users can insert own acceptances"
  on public.combat_match_acceptances
  for insert
  with check ("userId" = auth.uid());

-- System/service role can insert acceptances (for matchmaking)
create policy "System can insert acceptances"
  on public.combat_match_acceptances
  for insert
  with check (true);

-- Update combat_matches RLS to handle new status
grant select, insert, update on public.combat_matches to authenticated;

-- Users can view matches (for transparency)
create policy combat_matches_select_all_updated on public.combat_matches
  for select
  using (true);

-- Only system/API can create and update matches (no direct user insert/update)
-- We'll handle match creation through API endpoints with proper validation

commit;