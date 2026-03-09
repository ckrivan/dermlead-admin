-- Add profile_id column to attendees table to link attendees to app user profiles.
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Backfill: match existing attendees to profiles by email.
UPDATE attendees a
SET profile_id = p.id
FROM profiles p
WHERE lower(a.email) = lower(p.email)
  AND a.profile_id IS NULL;
