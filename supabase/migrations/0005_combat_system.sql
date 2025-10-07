-- Combat system: Add combat logs, configuration, and battle state tracking
-- This enables live-streamed AI-narrated gladiator battles

begin;

-- Add combat configuration fields to combat_matches table
alter table public.combat_matches
  add column if not exists "maxActions" integer not null default 20,
  add column if not exists "actionIntervalSeconds" integer not null default 4,
  add column if not exists "deathChancePercent" integer not null default 0,
  add column if not exists "injuryChancePercent" integer not null default 15,
  add column if not exists "winnerId" uuid references public.gladiators(id) on delete set null,
  add column if not exists "winnerMethod" text, -- 'submission', 'knockout', 'death', 'forfeit'
  add column if not exists "totalActions" integer not null default 0,
  add column if not exists "durationSeconds" integer;

-- Add indexes for efficient queries
create index if not exists idx_combat_matches_status on public.combat_matches("status");
create index if not exists idx_combat_matches_arena_server on public.combat_matches("arenaSlug", "serverId");
create index if not exists idx_combat_matches_winner on public.combat_matches("winnerId");

-- COMBAT LOGS TABLE ----------------------------------------------
-- Stores each action/narration during a battle for replay and analysis
create table if not exists public.combat_logs (
  id uuid primary key default gen_random_uuid(),
  
  -- Match reference
  "matchId" uuid not null references public.combat_matches(id) on delete cascade,
  
  -- Log entry details
  "actionNumber" integer not null, -- Sequential action counter (0 = intro, 1-N = actions)
  "type" text not null, -- 'introduction', 'action', 'injury', 'death', 'victory', 'system'
  "message" text not null, -- AI-generated narration in the current locale
  "locale" text not null default 'en', -- 'en' or 'fr'
  
  -- Combat state at this moment (optional, for detailed replay)
  "gladiator1Health" integer,
  "gladiator2Health" integer,
  "metadata" jsonb, -- Additional data: damage dealt, action type, etc.
  
  -- Timestamps
  "createdAt" timestamptz not null default now()
);

-- Indexes for efficient log retrieval
create index if not exists idx_combat_logs_match on public.combat_logs("matchId");
create index if not exists idx_combat_logs_match_action on public.combat_logs("matchId", "actionNumber");
create index if not exists idx_combat_logs_created on public.combat_logs("createdAt");

-- RLS policies for combat_logs (users can only read logs for their own matches)
alter table public.combat_logs enable row level security;

create policy "Users can read logs for their matches"
  on public.combat_logs
  for select
  using (
    exists (
      select 1 from public.combat_matches cm
      inner join public.gladiators g1 on g1.id = cm."gladiator1Id"
      inner join public.gladiators g2 on g2.id = cm."gladiator2Id"
      where cm.id = combat_logs."matchId"
        and (g1."userId" = auth.uid() or g2."userId" = auth.uid())
    )
  );

-- Service role can insert logs (API will use service role for streaming)
create policy "Service role can insert logs"
  on public.combat_logs
  for insert
  with check (true);

commit;

