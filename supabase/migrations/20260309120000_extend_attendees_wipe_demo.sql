-- Migration: Extend attendees schema with new fields + wipe all demo data + create DID 2026 event
-- New columns: credentials, npi_number, street_address, street_address_2, city, state, postal_code

-- 1. Add new columns to attendees
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS credentials TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS npi_number TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS street_address_2 TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- 1b. Update badge_type check constraint to include 'industry'
ALTER TABLE attendees DROP CONSTRAINT IF EXISTS attendees_badge_type_check;
ALTER TABLE attendees ADD CONSTRAINT attendees_badge_type_check
  CHECK (badge_type IN ('attendee', 'industry', 'speaker', 'exhibitor', 'sponsor', 'staff', 'vip', 'press'));

-- 2. Wipe all demo/dummy data (FK-safe order: children first)
DELETE FROM group_members;
DELETE FROM session_speakers;
DELETE FROM user_agenda;
DELETE FROM speaker_messages;
DELETE FROM attendees;
DELETE FROM leads;
DELETE FROM sessions;
DELETE FROM speakers;
DELETE FROM exhibitors;
DELETE FROM sponsors;
DELETE FROM announcements;
DELETE FROM event_groups;
DELETE FROM events;
-- Keep: organizations, profiles (auth-related)

-- 3. Insert fresh DID 2026 event linked to existing organization
INSERT INTO events (id, organization_id, name, slug, location, start_date, end_date, description)
SELECT
  gen_random_uuid(),
  id,
  'Diversity in Dermatology 2026',
  'did-2026',
  'Washington, DC',
  '2026-10-15',
  '2026-10-17',
  'Annual dermatology innovation conference featuring the latest advances in dermatological care.'
FROM organizations
LIMIT 1;
