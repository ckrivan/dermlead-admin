-- Feature toggles: allow admins to show/hide sidebar sections per event.
-- Default enables all toggleable features so existing events are unaffected.

ALTER TABLE events ADD COLUMN IF NOT EXISTS enabled_features JSONB
  DEFAULT '{
    "leads": true,
    "badges": true,
    "faculty": true,
    "sessions": true,
    "industry_partners": true,
    "announcements": true,
    "moderation": true,
    "faq": true,
    "support": true,
    "branding": true,
    "attendees": true
  }'::jsonb;
