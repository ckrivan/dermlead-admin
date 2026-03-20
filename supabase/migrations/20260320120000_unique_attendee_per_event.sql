-- Remove duplicate attendee records (keep the one with the highest badge_type privilege, or earliest)
-- Priority: staff > everything else
DELETE FROM attendees a
USING attendees b
WHERE a.event_id = b.event_id
  AND lower(a.email) = lower(b.email)
  AND a.id != b.id
  AND (
    -- Keep staff over non-staff
    (b.badge_type = 'staff' AND a.badge_type != 'staff')
    -- If same badge_type, keep earlier record
    OR (a.badge_type = b.badge_type AND a.created_at > b.created_at)
  );

-- Prevent future duplicates: one attendee record per email per event
ALTER TABLE attendees
ADD CONSTRAINT attendees_event_email_unique
UNIQUE (event_id, email);
