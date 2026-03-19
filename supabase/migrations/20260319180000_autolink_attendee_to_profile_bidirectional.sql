-- Auto-link attendees → profiles when attendee is created or email changes.
-- This is the mirror of the existing profiles → attendees trigger.
-- Covers the case where admin creates an attendee AFTER the person already has an account.
CREATE OR REPLACE FUNCTION auto_link_profile_on_attendee_change()
RETURNS TRIGGER AS $$
DECLARE
  matched_profile_id UUID;
BEGIN
  -- Only act if profile_id is not already set and email exists
  IF NEW.profile_id IS NOT NULL OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find matching profile by email
  SELECT id INTO matched_profile_id
  FROM profiles
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF matched_profile_id IS NOT NULL THEN
    NEW.profile_id := matched_profile_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_profile_on_attendee ON attendees;
CREATE TRIGGER trg_auto_link_profile_on_attendee
BEFORE INSERT OR UPDATE OF email ON attendees
FOR EACH ROW
EXECUTE FUNCTION auto_link_profile_on_attendee_change();

-- Backfill: link any existing unlinked attendees that have matching profiles
UPDATE attendees a
SET profile_id = p.id
FROM profiles p
WHERE a.profile_id IS NULL
  AND a.email IS NOT NULL
  AND lower(a.email) = lower(p.email);
