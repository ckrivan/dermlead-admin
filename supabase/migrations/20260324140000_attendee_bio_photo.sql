-- Add bio and photo_url to attendees table for attendee-speakers.
-- These fields allow admins to manage speaker profiles directly on attendee records
-- without creating duplicate entries in the speakers table.
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS photo_url TEXT;
