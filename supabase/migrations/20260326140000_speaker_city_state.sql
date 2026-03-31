-- Add city and state to speakers table
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS state TEXT;

-- Backfill from linked attendee records
UPDATE speakers s SET city = a.city, state = a.state
FROM attendees a WHERE s.attendee_id = a.id
AND s.city IS NULL AND a.city IS NOT NULL;
