-- Add sender info and badge-type targeting to announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_badge_types TEXT[];
