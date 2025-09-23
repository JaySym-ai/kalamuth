-- Run this SQL in your Supabase SQL Editor to add the unique constraint
-- This prevents duplicate gladiator names within the same ludus

BEGIN;

-- Step 1: Remove duplicate gladiators, keeping only the oldest one (earliest createdAt)
-- This uses a CTE to identify duplicates and delete all but the first one
WITH duplicates AS (
  SELECT
    id,
    "ludusId",
    lower(name || ' ' || surname) AS full_name,
    row_number() OVER (
      PARTITION BY "ludusId", lower(name || ' ' || surname)
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM public.gladiators
)
DELETE FROM public.gladiators
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Create a unique index on (ludusId, LOWER(name || ' ' || surname))
-- This ensures case-insensitive uniqueness of full names within each ludus
CREATE UNIQUE INDEX IF NOT EXISTS gladiators_ludus_fullname_unique
  ON public.gladiators ("ludusId", lower(name || ' ' || surname));

COMMIT;
