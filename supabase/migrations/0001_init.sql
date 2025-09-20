-- Supabase schema + RLS for Kalamuth (self-hosted)
-- Run this in Supabase SQL editor or via Supabase CLI as an initial migration.

-- Extensions (for gen_random_uuid)
create extension if not exists pgcrypto;

-- USERS -------------------------------------------------------------
-- Mirrors the auth.users id. Holds onboarding flags.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  "onboardingDone" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- LUDI --------------------------------------------------------------
create table if not exists public.ludi (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references auth.users(id) on delete cascade,
  "serverId" text not null,
  name text not null,
  "logoUrl" text not null,
  treasury jsonb not null default jsonb_build_object('currency','sestertii','amount',0),
  reputation int not null default 0,
  morale int not null default 50,
  facilities jsonb not null default jsonb_build_object('infirmaryLevel',1,'trainingGroundLevel',1,'quartersLevel',1,'kitchenLevel',1),
  "maxGladiators" int not null default 5,
  "gladiatorCount" int not null default 0,
  motto text,
  "locationCity" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "isDeleted" boolean not null default false,
  unique ("userId", "serverId")
);

-- GLADIATORS --------------------------------------------------------
create table if not exists public.gladiators (
  id uuid primary key default gen_random_uuid(),
  "ludusId" uuid not null references public.ludi(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "serverId" text,
  name text,
  surname text,
  "avatarUrl" text,
  "birthCity" text,
  health int,
  stats jsonb,
  personality jsonb,
  backstory text,
  "lifeGoal" text,
  likes jsonb,
  dislikes jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- JOBS --------------------------------------------------------------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null,
  "ludusId" uuid not null references public.ludi(id) on delete cascade,
  "userId" uuid not null references auth.users(id) on delete cascade,
  "serverId" text,
  count int,
  "minRequired" int,
  "existingCount" int,
  created int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  "createdAt" timestamptz not null default now(),
  "finishedAt" timestamptz
);

-- INDEXES -----------------------------------------------------------
create index if not exists idx_ludi_user on public.ludi("userId");
create index if not exists idx_ludi_server on public.ludi("serverId");
create index if not exists idx_gladiators_ludus on public.gladiators("ludusId");
create index if not exists idx_gladiators_user on public.gladiators("userId");
create index if not exists idx_jobs_user on public.jobs("userId");

-- UPDATED AT TRIGGER ------------------------------------------------
create or replace function public.set_updated_at() returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

create trigger set_ludi_updated_at
before update on public.ludi
for each row execute procedure public.set_updated_at();

create trigger set_gladiators_updated_at
before update on public.gladiators
for each row execute procedure public.set_updated_at();

-- RLS: Enable and grant base privileges -----------------------------
alter table public.users enable row level security;
alter table public.ludi enable row level security;
alter table public.gladiators enable row level security;
alter table public.jobs enable row level security;

-- Allow authenticated role to attempt operations (RLS will still gate rows)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.ludi to authenticated;
grant select, insert, update, delete on public.gladiators to authenticated;
grant select, insert, update, delete on public.jobs to authenticated;

-- USERS policies
create policy users_select_own on public.users for select
  using (id = auth.uid());
create policy users_insert_self on public.users for insert
  with check (id = auth.uid());
create policy users_update_own on public.users for update
  using (id = auth.uid()) with check (id = auth.uid());

-- LUDI policies
create policy ludi_select_own on public.ludi for select
  using ("userId" = auth.uid());
create policy ludi_insert_self on public.ludi for insert
  with check ("userId" = auth.uid());
create policy ludi_update_own on public.ludi for update
  using ("userId" = auth.uid()) with check ("userId" = auth.uid());
create policy ludi_delete_own on public.ludi for delete
  using ("userId" = auth.uid());

-- GLADIATORS policies
create policy gladiators_select_own on public.gladiators for select
  using ("userId" = auth.uid());
create policy gladiators_insert_self on public.gladiators for insert
  with check ("userId" = auth.uid());
create policy gladiators_update_own on public.gladiators for update
  using ("userId" = auth.uid()) with check ("userId" = auth.uid());
create policy gladiators_delete_own on public.gladiators for delete
  using ("userId" = auth.uid());

-- JOBS policies
create policy jobs_select_own on public.jobs for select
  using ("userId" = auth.uid());
create policy jobs_insert_self on public.jobs for insert
  with check ("userId" = auth.uid());
create policy jobs_update_own on public.jobs for update
  using ("userId" = auth.uid()) with check ("userId" = auth.uid());
create policy jobs_delete_own on public.jobs for delete
  using ("userId" = auth.uid());

