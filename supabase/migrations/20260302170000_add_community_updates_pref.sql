-- Add community_updates to notification_preferences default

ALTER TABLE profiles
ALTER COLUMN notification_preferences
SET DEFAULT '{"push_enabled":true,"session_reminders":true,"messages":true,"community_updates":true}'::jsonb;
