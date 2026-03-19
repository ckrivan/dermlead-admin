-- Remove the badge_type → profiles.role sync trigger.
-- Staff is now event-scoped via badge_type, NOT profiles.role.
-- The Flutter app reads badge_type directly from attendees table per event.
DROP TRIGGER IF EXISTS trg_sync_badge_type_to_role ON attendees;
DROP FUNCTION IF EXISTS sync_badge_type_to_profile_role();

-- Fix any profiles that were incorrectly escalated to 'staff' by the old trigger.
-- Only reset profiles that are 'staff' but should be 'attendee'.
-- Do NOT touch 'admin' or 'rep' profiles.
UPDATE profiles
SET role = 'attendee', updated_at = NOW()
WHERE role = 'staff';
