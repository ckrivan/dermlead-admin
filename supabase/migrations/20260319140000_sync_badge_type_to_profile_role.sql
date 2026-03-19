-- Trigger: escalate profiles.role when attendees.badge_type is set to staff
-- ONLY escalates, never downgrades (staff at IDF stays staff even if attendee at DID)
CREATE OR REPLACE FUNCTION sync_badge_type_to_profile_role()
RETURNS TRIGGER AS $$
DECLARE
  current_role TEXT;
BEGIN
  -- Only act if attendee has a linked profile
  IF NEW.profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only act if badge_type actually changed, or profile_id was just linked
  IF NOT (OLD.badge_type IS DISTINCT FROM NEW.badge_type
          OR OLD.profile_id IS DISTINCT FROM NEW.profile_id) THEN
    RETURN NEW;
  END IF;

  -- Get current profile role
  SELECT role INTO current_role FROM profiles WHERE id = NEW.profile_id;

  -- Rank: admin=5, staff=4, rep=3, leadership=2, attendee=1
  -- Only escalate if new badge_type maps to a HIGHER rank
  IF NEW.badge_type = 'staff' AND current_role NOT IN ('admin', 'staff') THEN
    UPDATE profiles
    SET role = 'staff', updated_at = NOW()
    WHERE id = NEW.profile_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_badge_type_to_role ON attendees;
CREATE TRIGGER trg_sync_badge_type_to_role
AFTER UPDATE OF badge_type, profile_id ON attendees
FOR EACH ROW
EXECUTE FUNCTION sync_badge_type_to_profile_role();
