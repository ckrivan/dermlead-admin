-- Part 1: Backfill — link existing attendees to profiles by email match
UPDATE attendees a
SET profile_id = p.id
FROM profiles p
WHERE a.profile_id IS NULL
  AND lower(a.email) = lower(p.email);

-- Part 2: Auto-link trigger — when a profile is created/updated, find matching attendees
CREATE OR REPLACE FUNCTION auto_link_attendee_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When a profile is created or email changes, link any unlinked attendees
  IF NEW.email IS NOT NULL THEN
    UPDATE attendees
    SET profile_id = NEW.id
    WHERE profile_id IS NULL
      AND lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_attendee_on_profile ON profiles;
CREATE TRIGGER trg_auto_link_attendee_on_profile
AFTER INSERT OR UPDATE OF email ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_link_attendee_on_profile_change();
