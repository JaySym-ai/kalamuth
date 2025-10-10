# Tavern Gladiators - currentHealth Column Fix

## Problem
The `tavern_gladiators` table was missing the `currentHealth` column, causing generation failures with error:
```
PGRST204: Could not find the 'currentHealth' column of 'tavern_gladiators' in the schema cache
```

## Solution
Created migration `0020_add_current_health_to_tavern_gladiators.sql` to add the missing column.

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/0020_add_current_health_to_tavern_gladiators.sql`
4. Paste into the SQL Editor
5. Click "Run"

### Option 2: Using Supabase CLI
```bash
# First, link your project
supabase link --project-ref <your-project-ref>

# Then push migrations
supabase db push
```

### Option 3: Direct SQL Connection
Connect to your Supabase database directly and run:
```sql
alter table public.tavern_gladiators
add column if not exists "currentHealth" int;

update public.tavern_gladiators
set "currentHealth" = health
where "currentHealth" is null;

alter table public.tavern_gladiators
alter column "currentHealth" set not null;

alter table public.tavern_gladiators
add constraint tavern_gladiators_current_health_check check ("currentHealth" >= 0 and "currentHealth" <= health);
```

## What the Migration Does
1. Adds `currentHealth` column to `tavern_gladiators` table
2. Sets existing rows' `currentHealth` to equal their `health` (full health)
3. Adds NOT NULL constraint
4. Adds check constraint to ensure `currentHealth` is valid (0 to health)

## After Migration
Tavern gladiator generation should work correctly. The `currentHealth` column will track the current health of tavern gladiators, allowing them to be injured or sick before recruitment.

