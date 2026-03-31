-- Add badge_types TEXT[] column for attendees who have multiple event roles.
-- badge_type (singular) is kept for backward compatibility.
-- When badge_types is set, it takes precedence over badge_type.
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS badge_types TEXT[];

-- Set Risha Bellomo's badge_types (she is both leadership and organiser)
UPDATE attendees
SET badge_types = ARRAY['leadership', 'organiser']
WHERE profile_id = '6c47d285-f38f-4b0f-b566-e9dd2a35aa0d';

-- Set Lindita Vinca's badge_types (badge stays 'attendee', speaks at product theater)
UPDATE attendees
SET badge_types = ARRAY['speaker']
WHERE email = 'lvinca@me.com';
