-- Run this SQL to see which gladiators are duplicates
-- This helps you understand what will be deleted before running the migration

SELECT 
  "ludusId",
  name,
  surname,
  lower(name || ' ' || surname) AS full_name,
  "createdAt",
  id,
  CASE 
    WHEN row_number() OVER (
      PARTITION BY "ludusId", lower(name || ' ' || surname) 
      ORDER BY "createdAt" ASC
    ) = 1 THEN 'KEEP'
    ELSE 'DELETE'
  END AS action
FROM public.gladiators
WHERE ("ludusId", lower(name || ' ' || surname)) IN (
  SELECT "ludusId", lower(name || ' ' || surname)
  FROM public.gladiators
  GROUP BY "ludusId", lower(name || ' ' || surname)
  HAVING COUNT(*) > 1
)
ORDER BY "ludusId", full_name, "createdAt" ASC;
