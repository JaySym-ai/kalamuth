-- Add unique constraint for gladiator names within a ludus
-- This prevents duplicate name+surname combinations in the same ludus

begin;

-- Step 1: Remove duplicate gladiators, keeping only the oldest one (earliest createdAt)
-- This uses a CTE to identify duplicates and delete all but the first one
with duplicates as (
  select
    id,
    "ludusId",
    lower(name || ' ' || surname) as full_name,
    row_number() over (
      partition by "ludusId", lower(name || ' ' || surname)
      order by "createdAt" asc
    ) as rn
  from public.gladiators
)
delete from public.gladiators
where id in (
  select id from duplicates where rn > 1
);

-- Step 2: Create a unique index on (ludusId, LOWER(name || ' ' || surname))
-- This ensures case-insensitive uniqueness of full names within each ludus
create unique index if not exists gladiators_ludus_fullname_unique
  on public.gladiators ("ludusId", lower(name || ' ' || surname));

commit;
