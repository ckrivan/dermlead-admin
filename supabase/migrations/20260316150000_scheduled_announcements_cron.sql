-- Set up pg_cron to process scheduled announcements every minute
-- Uses pg_net to invoke the Edge Function via HTTP
SELECT cron.schedule(
  'process-scheduled-announcements-cron',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xxzenpjxsysqpimqtosi.supabase.co/functions/v1/process-scheduled-announcements',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
