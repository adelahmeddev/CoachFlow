-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to auto-delete messages older than 10 days
-- and update conversation metadata accordingly
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete messages older than 10 days
  DELETE FROM "Message"
  WHERE "createdAt" < NOW() - INTERVAL '10 days';

  -- Update conversations: set lastMessageAt/Preview to the most recent remaining message
  UPDATE "Conversation" c
  SET
    "lastMessageAt" = sub.max_created,
    "lastMessagePreview" = sub.last_body,
    "updatedAt" = NOW()
  FROM (
    SELECT
      "conversationId",
      MAX("createdAt") AS max_created,
      (ARRAY_AGG("body" ORDER BY "createdAt" DESC))[1] AS last_body
    FROM "Message"
    GROUP BY "conversationId"
  ) sub
  WHERE c."id" = sub."conversationId"
    AND (
      c."lastMessageAt" IS DISTINCT FROM sub.max_created
      OR c."lastMessagePreview" IS DISTINCT FROM sub.last_body
    );

  -- Delete conversations with no messages left
  DELETE FROM "Conversation"
  WHERE "id" NOT IN (SELECT DISTINCT "conversationId" FROM "Message");
END;
$$;

-- Schedule daily cleanup at 3 AM
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 3 * * *',
  'SELECT cleanup_old_messages()'
);
