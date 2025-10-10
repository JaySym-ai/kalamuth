-- Create tavern_gladiators table for tavern recruitment system
-- These are temporary gladiators available for recruitment in the tavern

begin;

create table if not exists public.tavern_gladiators (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references auth.users(id) on delete cascade,
  "ludusId" uuid not null references public.ludi(id) on delete cascade,
  "serverId" text,
  
  -- Identity
  name text not null,
  surname text not null,
  "avatarUrl" text not null,
  
  -- Vital
  health int not null check (health >= 30 and health <= 300),
  alive boolean not null default true,
  
  -- Conditions (bilingual JSON)
  injury jsonb,
  "injuryTimeLeftHours" int,
  sickness jsonb,
  
  -- Attributes (bilingual JSON)
  stats jsonb not null,
  
  -- Combat / Ranking
  "rankingPoints" int not null default 1000,
  
  -- Narrative (bilingual JSON)
  "lifeGoal" jsonb not null,
  personality jsonb not null,
  backstory jsonb not null,
  weakness jsonb not null,
  fear jsonb not null,
  likes jsonb not null,
  dislikes jsonb not null,
  "birthCity" text not null,
  handicap jsonb,
  "uniquePower" jsonb,
  "physicalCondition" jsonb not null,
  "notableHistory" jsonb not null,
  
  -- Timestamps
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Create indexes for common queries
create index if not exists idx_tavern_gladiators_ludus_id on public.tavern_gladiators("ludusId");
create index if not exists idx_tavern_gladiators_user_id on public.tavern_gladiators("userId");
create index if not exists idx_tavern_gladiators_created_at on public.tavern_gladiators("createdAt");

-- Enable RLS
alter table public.tavern_gladiators enable row level security;

-- RLS Policies
-- Users can view tavern gladiators for their own ludus
create policy "Users can view their own tavern gladiators"
  on public.tavern_gladiators for select
  using ("userId" = auth.uid());

-- Users can insert tavern gladiators for their own ludus
create policy "Users can insert tavern gladiators for their ludus"
  on public.tavern_gladiators for insert
  with check ("userId" = auth.uid());

-- Users can update tavern gladiators for their own ludus
create policy "Users can update their own tavern gladiators"
  on public.tavern_gladiators for update
  using ("userId" = auth.uid())
  with check ("userId" = auth.uid());

-- Users can delete tavern gladiators for their own ludus
create policy "Users can delete their own tavern gladiators"
  on public.tavern_gladiators for delete
  using ("userId" = auth.uid());

-- Enable Realtime for tavern_gladiators
alter publication supabase_realtime add table public.tavern_gladiators;
alter table public.tavern_gladiators replica identity full;

commit;

