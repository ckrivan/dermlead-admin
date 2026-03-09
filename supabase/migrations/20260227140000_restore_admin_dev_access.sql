-- DEV MODE: Restore permissive policies for admin panel access.
-- The tighten_rls_for_production migration broke all data pages because
-- the org-scoped policies aren't working in practice with the anon key.
-- These permissive policies override the org-scoped ones (PostgreSQL OR's
-- all PERMISSIVE policies — if any returns true, access is granted).
-- Before production: remove these and fix the org-scoped policies.

-- events
DROP POLICY IF EXISTS "dev_public_read_events" ON events;
DROP POLICY IF EXISTS "dev_public_write_events" ON events;
CREATE POLICY "dev_public_read_events" ON events FOR SELECT USING (true);
CREATE POLICY "dev_public_write_events" ON events FOR ALL USING (true) WITH CHECK (true);

-- attendees
DROP POLICY IF EXISTS "dev_public_read_attendees" ON attendees;
DROP POLICY IF EXISTS "dev_public_write_attendees" ON attendees;
CREATE POLICY "dev_public_read_attendees" ON attendees FOR SELECT USING (true);
CREATE POLICY "dev_public_write_attendees" ON attendees FOR ALL USING (true) WITH CHECK (true);

-- leads
DROP POLICY IF EXISTS "dev_public_read_leads" ON leads;
DROP POLICY IF EXISTS "dev_public_write_leads" ON leads;
CREATE POLICY "dev_public_read_leads" ON leads FOR SELECT USING (true);
CREATE POLICY "dev_public_write_leads" ON leads FOR ALL USING (true) WITH CHECK (true);

-- sessions
DROP POLICY IF EXISTS "dev_public_read_sessions" ON sessions;
DROP POLICY IF EXISTS "dev_public_write_sessions" ON sessions;
CREATE POLICY "dev_public_read_sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "dev_public_write_sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

-- session_speakers
DROP POLICY IF EXISTS "dev_public_read_session_speakers" ON session_speakers;
DROP POLICY IF EXISTS "dev_public_write_session_speakers" ON session_speakers;
CREATE POLICY "dev_public_read_session_speakers" ON session_speakers FOR SELECT USING (true);
CREATE POLICY "dev_public_write_session_speakers" ON session_speakers FOR ALL USING (true) WITH CHECK (true);

-- speakers
DROP POLICY IF EXISTS "dev_public_read_speakers" ON speakers;
DROP POLICY IF EXISTS "dev_public_write_speakers" ON speakers;
CREATE POLICY "dev_public_read_speakers" ON speakers FOR SELECT USING (true);
CREATE POLICY "dev_public_write_speakers" ON speakers FOR ALL USING (true) WITH CHECK (true);

-- exhibitors
DROP POLICY IF EXISTS "dev_public_read_exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "dev_public_write_exhibitors" ON exhibitors;
CREATE POLICY "dev_public_read_exhibitors" ON exhibitors FOR SELECT USING (true);
CREATE POLICY "dev_public_write_exhibitors" ON exhibitors FOR ALL USING (true) WITH CHECK (true);

-- sponsors
DROP POLICY IF EXISTS "dev_public_read_sponsors" ON sponsors;
DROP POLICY IF EXISTS "dev_public_write_sponsors" ON sponsors;
CREATE POLICY "dev_public_read_sponsors" ON sponsors FOR SELECT USING (true);
CREATE POLICY "dev_public_write_sponsors" ON sponsors FOR ALL USING (true) WITH CHECK (true);

-- event_groups
DROP POLICY IF EXISTS "dev_public_read_event_groups" ON event_groups;
DROP POLICY IF EXISTS "dev_public_write_event_groups" ON event_groups;
CREATE POLICY "dev_public_read_event_groups" ON event_groups FOR SELECT USING (true);
CREATE POLICY "dev_public_write_event_groups" ON event_groups FOR ALL USING (true) WITH CHECK (true);

-- group_members
DROP POLICY IF EXISTS "dev_public_read_group_members" ON group_members;
DROP POLICY IF EXISTS "dev_public_write_group_members" ON group_members;
CREATE POLICY "dev_public_read_group_members" ON group_members FOR SELECT USING (true);
CREATE POLICY "dev_public_write_group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);

-- NOTE: attendee_groups and attendee_group_members don't exist in remote DB.
-- The unified groups system uses event_groups and group_members instead.
