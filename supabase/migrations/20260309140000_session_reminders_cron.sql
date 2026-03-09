-- Create sent_session_reminders table for deduplication
CREATE TABLE IF NOT EXISTS sent_session_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_sent_session_reminders_session
  ON sent_session_reminders(session_id);

-- Dev-mode RLS policies
ALTER TABLE sent_session_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to sent_session_reminders" ON sent_session_reminders;
DROP POLICY IF EXISTS "Allow public write access to sent_session_reminders" ON sent_session_reminders;

CREATE POLICY "Allow public read access to sent_session_reminders"
  ON sent_session_reminders FOR SELECT USING (true);

CREATE POLICY "Allow public write access to sent_session_reminders"
  ON sent_session_reminders FOR ALL USING (true) WITH CHECK (true);

-- Set up pg_cron to call session-reminder every 5 minutes
-- This uses pg_net to invoke the Edge Function via HTTP
SELECT cron.schedule(
  'session-reminder-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xxzenpjxsysqpimqtosi.supabase.co/functions/v1/session-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
