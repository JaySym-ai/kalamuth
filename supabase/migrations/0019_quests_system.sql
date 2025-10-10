-- Quests system for gladiator missions
-- Allows ludus owners to send gladiators on quests for rewards

begin;

-- QUESTS TABLE -------------------------------------------------------
-- Tracks quests available and in progress for each ludus
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  
  -- Ownership and context
  "userId" uuid not null references auth.users(id) on delete cascade,
  "ludusId" uuid not null references public.ludi(id) on delete cascade,
  "serverId" text,
  
  -- Quest assignment
  "gladiatorId" uuid references public.gladiators(id) on delete set null,
  
  -- Quest narrative and details
  title text not null,
  description text not null,
  "volunteerMessage" text,
  
  -- Rewards and risks
  reward integer not null check (reward >= 1 and reward <= 5),
  "dangerPercentage" integer not null check ("dangerPercentage" >= 0 and "dangerPercentage" <= 99),
  "sicknessPercentage" integer not null check ("sicknessPercentage" >= 0 and "sicknessPercentage" <= 99),
  "deathPercentage" integer not null check ("deathPercentage" >= 0 and "deathPercentage" <= 99),
  
  -- Status tracking
  status text not null default 'pending' check (status in ('pending', 'active', 'completed', 'failed', 'cancelled')),
  "startedAt" timestamptz,
  "completedAt" timestamptz,
  
  -- Results
  result text,
  "healthLost" integer default 0,
  "sicknessContracted" text,
  "injuryContracted" text,
  "questFailed" boolean default false,
  "gladiatorDied" boolean default false,
  
  -- Metadata
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists idx_quests_ludus on public.quests("ludusId");
create index if not exists idx_quests_user on public.quests("userId");
create index if not exists idx_quests_gladiator on public.quests("gladiatorId");
create index if not exists idx_quests_status on public.quests(status);
create index if not exists idx_quests_ludus_status on public.quests("ludusId", status);

-- RLS POLICIES -------------------------------------------------------
alter table public.quests enable row level security;

-- Users can see their own quests
create policy "Users can view their own quests"
  on public.quests for select
  using (auth.uid() = "userId");

-- Users can insert quests for their ludus
create policy "Users can create quests for their ludus"
  on public.quests for insert
  with check (auth.uid() = "userId");

-- Users can update their own quests
create policy "Users can update their own quests"
  on public.quests for update
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");

-- Users can delete their own quests
create policy "Users can delete their own quests"
  on public.quests for delete
  using (auth.uid() = "userId");

-- Enable realtime for quests
alter publication supabase_realtime add table public.quests;

commit;

