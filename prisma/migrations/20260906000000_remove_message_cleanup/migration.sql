-- Remove automatic 10-day chat deletion.
-- Chat history is immutable user data: it must never be deleted automatically.
-- Any future cleanup must be explicit and admin-controlled, never scheduled.
--
-- This reverses 20260830130000_add_message_cleanup_cron:
--  1. Unschedule the daily pg_cron job (only if pg_cron is installed).
--  2. Drop the cleanup_old_messages() function so no code path can invoke it.
-- Existing messages and conversations are left completely intact.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('cleanup-old-messages');
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
END
$$;

DROP FUNCTION IF EXISTS cleanup_old_messages();
