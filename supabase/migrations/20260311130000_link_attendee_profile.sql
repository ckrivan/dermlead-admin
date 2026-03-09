-- Link attendee records to user profiles when they register
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id);

-- Auto-link: when user joins event via invite code, find matching attendee by email
CREATE OR REPLACE FUNCTION link_attendee_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE attendees
  SET profile_id = NEW.user_id
  WHERE event_id = NEW.event_id
    AND profile_id IS NULL
    AND LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = NEW.user_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_link_attendee ON event_registrations;
CREATE TRIGGER auto_link_attendee
  AFTER INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION link_attendee_on_registration();
