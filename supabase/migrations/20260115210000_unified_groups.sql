-- Unified Groups System Migration
-- Allows groups to contain attendees, speakers, sponsors, and exhibitors

-- Step 1: Rename attendee_groups to event_groups (more generic)
ALTER TABLE IF EXISTS attendee_groups RENAME TO event_groups;

-- Step 2: Create unified group_members table with entity_type
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES event_groups(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('attendee', 'speaker', 'sponsor', 'exhibitor')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, entity_type, entity_id)
);

-- Step 3: Migrate existing attendee_group_members data (if table exists)
INSERT INTO group_members (group_id, entity_type, entity_id, created_at)
SELECT group_id, 'attendee', attendee_id, created_at
FROM attendee_group_members
ON CONFLICT DO NOTHING;

-- Step 4: Enable RLS with permissive dev policies
ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to event_groups" ON event_groups;
DROP POLICY IF EXISTS "Allow public access to group_members" ON group_members;

CREATE POLICY "Allow public access to event_groups"
ON event_groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to group_members"
ON group_members FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE event_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- Step 6: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_members_entity
ON group_members(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group
ON group_members(group_id);
