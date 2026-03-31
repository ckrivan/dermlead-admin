-- Backfill: create linked speaker records for existing attendees with 'speaker' in badge_types.
-- This is a one-time migration. Going forward, the admin panel auto-creates speakers on save.

INSERT INTO speakers (full_name, credentials, institution, specialty, email, bio, photo_url, event_id, attendee_id, role)
SELECT
  a.first_name || ' ' || a.last_name,
  a.credentials,
  a.institution,
  a.specialty,
  a.email,
  a.bio,
  a.photo_url,
  a.event_id,
  a.id,
  ARRAY['faculty']
FROM attendees a
WHERE a.badge_types @> ARRAY['speaker']
  AND NOT EXISTS (
    SELECT 1 FROM speakers s WHERE s.attendee_id = a.id
  );
