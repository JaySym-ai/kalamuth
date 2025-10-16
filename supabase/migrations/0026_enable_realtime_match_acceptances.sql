-- Enable realtime streaming for combat_match_acceptances in an idempotent way
-- so environments where it is already added to the supabase_realtime publication
-- do not error.

begin;

-- Add table to the supabase_realtime publication if not already a member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'combat_match_acceptances'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_match_acceptances';
  END IF;
END $$;

-- Ensure UPDATE/DELETE events can identify rows properly
ALTER TABLE public.combat_match_acceptances REPLICA IDENTITY FULL;

commit;

