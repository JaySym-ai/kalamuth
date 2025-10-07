-- Add ranking points to gladiators and create combat queue system
-- This enables matchmaking and queueing for arena combat

begin;

-- Add ranking points to gladiators table (default 1000)
alter table public.gladiators
  add column if not exists "rankingPoints" integer not null default 1000;

-- Create index for efficient ranking-based queries
create index if not exists idx_gladiators_ranking on public.gladiators("rankingPoints");

-- COMBAT QUEUE TABLE ------------------------------------------------
-- Tracks gladiators waiting to be matched for combat in each arena
create table if not exists public.combat_queue (
  id uuid primary key default gen_random_uuid(),
  
  -- Arena identification (using arena slug from ARENAS data)
  "arenaSlug" text not null,
  
  -- Server context (one queue per arena per server)
  "serverId" text not null,
  
  -- Gladiator and ownership
  "gladiatorId" uuid not null references public.gladiators(id) on delete cascade,
  "ludusId" uuid not null references public.ludi(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  
  -- Matchmaking data (snapshot at queue time for stable matching)
  "rankingPoints" integer not null,
  
  -- Queue metadata
  "queuedAt" timestamptz not null default now(),
  "status" text not null default 'waiting', -- 'waiting', 'matched', 'cancelled'
  
  -- Match reference (set when matched)
  "matchId" uuid,
  
  -- Ensure one gladiator can only be in one queue at a time
  unique ("gladiatorId")
);

-- COMBAT MATCHES TABLE ----------------------------------------------
-- Tracks matched pairs ready for combat (not yet implemented)
create table if not exists public.combat_matches (
  id uuid primary key default gen_random_uuid(),

  -- Arena and server
  "arenaSlug" text not null,
  "serverId" text not null,

  -- Matched gladiators
  "gladiator1Id" uuid not null references public.gladiators(id) on delete cascade,
  "gladiator2Id" uuid not null references public.gladiators(id) on delete cascade,

  -- Match status
  "status" text not null default 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

  -- Timestamps
  "matchedAt" timestamptz not null default now(),
  "startedAt" timestamptz,
  "completedAt" timestamptz
);

-- Ensure only one active match per arena per server (partial unique index)
create unique index if not exists idx_combat_matches_active_unique
  on public.combat_matches("arenaSlug", "serverId")
  where status in ('pending', 'in_progress');

-- INDEXES -----------------------------------------------------------
create index if not exists idx_combat_queue_arena_server on public.combat_queue("arenaSlug", "serverId");
create index if not exists idx_combat_queue_status on public.combat_queue("status");
create index if not exists idx_combat_queue_gladiator on public.combat_queue("gladiatorId");
create index if not exists idx_combat_queue_queued_at on public.combat_queue("queuedAt");

create index if not exists idx_combat_matches_arena_server on public.combat_matches("arenaSlug", "serverId");
create index if not exists idx_combat_matches_status on public.combat_matches("status");
create index if not exists idx_combat_matches_gladiators on public.combat_matches("gladiator1Id", "gladiator2Id");

-- RLS POLICIES ------------------------------------------------------
alter table public.combat_queue enable row level security;
alter table public.combat_matches enable row level security;

grant select, insert, update, delete on public.combat_queue to authenticated;
grant select, insert, update, delete on public.combat_matches to authenticated;

-- Users can view all queue entries on their server
create policy combat_queue_select_all on public.combat_queue for select
  using (true);

-- Users can only insert their own gladiators into queue
create policy combat_queue_insert_own on public.combat_queue for insert
  with check ("userId" = auth.uid());

-- Users can only update/delete their own queue entries
create policy combat_queue_update_own on public.combat_queue for update
  using ("userId" = auth.uid());

create policy combat_queue_delete_own on public.combat_queue for delete
  using ("userId" = auth.uid());

-- Users can view all matches
create policy combat_matches_select_all on public.combat_matches for select
  using (true);

-- Only system/API can create matches (no direct user insert)
-- We'll handle match creation through API endpoints with proper validation
-- NOTE: INSERT policy is missing here - this causes RLS errors!
-- Fixed in migration 0006_fix_combat_matches_rls.sql

commit;
