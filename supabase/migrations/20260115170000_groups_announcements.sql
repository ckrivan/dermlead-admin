-- Groups and Announcements Schema
-- Run this migration in your Supabase SQL Editor

-- Attendee Groups table
CREATE TABLE IF NOT EXISTS attendee_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by event
CREATE INDEX IF NOT EXISTS idx_attendee_groups_event_id ON attendee_groups(event_id);

-- Junction table for attendee-group membership
CREATE TABLE IF NOT EXISTS attendee_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES attendee_groups(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, attendee_id)
);

-- Indexes for membership lookups
CREATE INDEX IF NOT EXISTS idx_attendee_group_members_group_id ON attendee_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_attendee_group_members_attendee_id ON attendee_group_members(attendee_id);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_groups TEXT[], -- Array of group IDs, NULL means all attendees
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by event
CREATE INDEX IF NOT EXISTS idx_announcements_event_id ON announcements(event_id);

-- RLS Policies for attendee_groups
ALTER TABLE attendee_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view groups for their organization's events" ON attendee_groups;
CREATE POLICY "Users can view groups for their organization's events"
    ON attendee_groups FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert groups for their organization's events" ON attendee_groups;
CREATE POLICY "Users can insert groups for their organization's events"
    ON attendee_groups FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update groups for their organization's events" ON attendee_groups;
CREATE POLICY "Users can update groups for their organization's events"
    ON attendee_groups FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can delete groups for their organization's events" ON attendee_groups;
CREATE POLICY "Users can delete groups for their organization's events"
    ON attendee_groups FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies for attendee_group_members
ALTER TABLE attendee_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view group members for their organization" ON attendee_group_members;
CREATE POLICY "Users can view group members for their organization"
    ON attendee_group_members FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can manage group members for their organization" ON attendee_group_members;
CREATE POLICY "Users can manage group members for their organization"
    ON attendee_group_members FOR ALL
    TO authenticated
    USING (true);

-- RLS Policies for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view announcements for their organization's events" ON announcements;
CREATE POLICY "Users can view announcements for their organization's events"
    ON announcements FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert announcements for their organization's events" ON announcements;
CREATE POLICY "Users can insert announcements for their organization's events"
    ON announcements FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update announcements for their organization's events" ON announcements;
CREATE POLICY "Users can update announcements for their organization's events"
    ON announcements FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can delete announcements for their organization's events" ON announcements;
CREATE POLICY "Users can delete announcements for their organization's events"
    ON announcements FOR DELETE
    TO authenticated
    USING (true);
