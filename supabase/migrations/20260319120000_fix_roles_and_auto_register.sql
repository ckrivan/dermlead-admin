-- =============================================================
-- Fix Role System + Auto-Register on Attendee Link + Badge Types
-- =============================================================

-- 1. Drop old constraint FIRST so updates don't violate it
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migrate legacy role names
UPDATE profiles SET role = 'attendee' WHERE role = 'auditor';
UPDATE profiles SET role = 'leadership' WHERE role = 'leader';

-- 3. Add new constraint with canonical 5-role set
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'staff', 'leadership', 'attendee', 'rep'));

-- 3. Trigger: auto-create event_registration when attendee gets linked to a profile
CREATE OR REPLACE FUNCTION auto_register_linked_attendee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL AND (OLD.profile_id IS NULL OR OLD.profile_id != NEW.profile_id) THEN
    INSERT INTO event_registrations (event_id, user_id, organization_id)
    SELECT NEW.event_id, NEW.profile_id, NEW.organization_id
    WHERE NOT EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_id = NEW.event_id AND user_id = NEW.profile_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_register_on_attendee_link ON attendees;
CREATE TRIGGER auto_register_on_attendee_link
  AFTER UPDATE ON attendees
  FOR EACH ROW
  EXECUTE FUNCTION auto_register_linked_attendee();

-- 4. Migrate any existing 'leader' badge_type to 'leadership' and add to constraint
UPDATE attendees SET badge_type = 'leadership' WHERE badge_type = 'leader';
ALTER TABLE attendees DROP CONSTRAINT IF EXISTS attendees_badge_type_check;
ALTER TABLE attendees ADD CONSTRAINT attendees_badge_type_check
    CHECK (badge_type IN ('attendee', 'industry', 'speaker', 'exhibitor', 'sponsor', 'leadership', 'staff', 'vip', 'press'));

-- 5. Backfill: create event_registrations for already-linked attendees
INSERT INTO event_registrations (event_id, user_id, organization_id)
SELECT a.event_id, a.profile_id, a.organization_id
FROM attendees a
WHERE a.profile_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.event_id = a.event_id AND er.user_id = a.profile_id
  );
