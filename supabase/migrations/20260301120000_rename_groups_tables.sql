-- Rename tables to match the generic entity-based groups API.
-- The original migration created attendee_groups / attendee_group_members,
-- but the admin panel API references event_groups / group_members.

ALTER TABLE attendee_groups RENAME TO event_groups;
ALTER TABLE attendee_group_members RENAME TO group_members;

-- Add entity_type column for polymorphic membership (attendee, speaker, sponsor, exhibitor)
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'attendee';

-- Rename attendee_id to entity_id for generic usage
ALTER TABLE group_members RENAME COLUMN attendee_id TO entity_id;

-- Permissive RLS policies for dev mode
DROP POLICY IF EXISTS "Allow public read access to event_groups" ON event_groups;
DROP POLICY IF EXISTS "Allow public write access to event_groups" ON event_groups;
CREATE POLICY "Allow public read access to event_groups" ON event_groups FOR SELECT USING (true);
CREATE POLICY "Allow public write access to event_groups" ON event_groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to group_members" ON group_members;
DROP POLICY IF EXISTS "Allow public write access to group_members" ON group_members;
CREATE POLICY "Allow public read access to group_members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Allow public write access to group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);
