-- Schedule the session-reminder Edge Function to run every 5 minutes
-- Uses pg_cron + pg_net (enabled in migration 20260302160000)
-- Note: pg_cron and pg_net must be enabled via Supabase Dashboard > Database > Extensions

-- Ensure extensions are accessible
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule if already exists (may have been created by another migration)
SELECT cron.unschedule('session-reminder-every-5-min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'session-reminder-every-5-min');

SELECT cron.schedule(
    'session-reminder-every-5-min',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://xxzenpjxsysqpimqtosi.supabase.co/functions/v1/session-reminder',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);
