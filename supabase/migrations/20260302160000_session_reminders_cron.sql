-- Session reminder deduplication table + cron extensions

-- Track sent reminders to avoid duplicate notifications
CREATE TABLE IF NOT EXISTS sent_session_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sent_reminders_session ON sent_session_reminders(session_id);

ALTER TABLE sent_session_reminders ENABLE ROW LEVEL SECURITY;
-- No user-facing policies: only service_role writes via Edge Function

-- Enable pg_cron and pg_net for scheduled Edge Function calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
