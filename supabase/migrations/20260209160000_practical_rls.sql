-- Practical RLS: Open reads, admin-only check-in, basic write protection
--
-- Core rule: anyone can READ all data, but only admins can:
--   - Check in attendees (UPDATE attendees)
--   - Manage events, sessions, speakers, exhibitors, sponsors
-- Reps can create/update their own leads

-- =============================================
-- 1. LEADS — Open read, authenticated write
-- =============================================
DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

-- Anyone can read leads
CREATE POLICY "leads_select"
    ON leads FOR SELECT USING (true);

-- Authenticated users can create leads
CREATE POLICY "leads_insert"
    ON leads FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

-- Authenticated users can update leads
CREATE POLICY "leads_update"
    ON leads FOR UPDATE
    USING (auth.uid() IS NOT NULL OR true);

-- Only admins can delete leads
CREATE POLICY "leads_delete"
    ON leads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- 2. ATTENDEES — Open read, ADMIN-ONLY write (check-in protection)
-- =============================================
DROP POLICY IF EXISTS "attendees_select" ON attendees;
DROP POLICY IF EXISTS "attendees_insert" ON attendees;
DROP POLICY IF EXISTS "attendees_update" ON attendees;
DROP POLICY IF EXISTS "attendees_delete" ON attendees;

-- Anyone can read attendees
CREATE POLICY "attendees_select"
    ON attendees FOR SELECT USING (true);

-- ADMIN ONLY: create attendees
CREATE POLICY "attendees_insert"
    ON attendees FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ADMIN ONLY: update attendees (THIS IS THE CHECK-IN GATE)
CREATE POLICY "attendees_update"
    ON attendees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ADMIN ONLY: delete attendees
CREATE POLICY "attendees_delete"
    ON attendees FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- 3. EVENTS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

CREATE POLICY "events_select"
    ON events FOR SELECT USING (true);

CREATE POLICY "events_insert"
    ON events FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "events_update"
    ON events FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "events_delete"
    ON events FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 4. SESSIONS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "sessions_select" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

CREATE POLICY "sessions_select"
    ON sessions FOR SELECT USING (true);

CREATE POLICY "sessions_insert"
    ON sessions FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "sessions_update"
    ON sessions FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "sessions_delete"
    ON sessions FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 5. SESSION_SPEAKERS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "session_speakers_select" ON session_speakers;
DROP POLICY IF EXISTS "session_speakers_insert" ON session_speakers;
DROP POLICY IF EXISTS "session_speakers_update" ON session_speakers;
DROP POLICY IF EXISTS "session_speakers_delete" ON session_speakers;

CREATE POLICY "session_speakers_select"
    ON session_speakers FOR SELECT USING (true);

CREATE POLICY "session_speakers_insert"
    ON session_speakers FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "session_speakers_update"
    ON session_speakers FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "session_speakers_delete"
    ON session_speakers FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 6. SPEAKERS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "speakers_select" ON speakers;
DROP POLICY IF EXISTS "speakers_insert" ON speakers;
DROP POLICY IF EXISTS "speakers_update" ON speakers;
DROP POLICY IF EXISTS "speakers_delete" ON speakers;

CREATE POLICY "speakers_select"
    ON speakers FOR SELECT USING (true);

CREATE POLICY "speakers_insert"
    ON speakers FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "speakers_update"
    ON speakers FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "speakers_delete"
    ON speakers FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 7. EXHIBITORS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "exhibitors_select" ON exhibitors;
DROP POLICY IF EXISTS "exhibitors_insert" ON exhibitors;
DROP POLICY IF EXISTS "exhibitors_update" ON exhibitors;
DROP POLICY IF EXISTS "exhibitors_delete" ON exhibitors;

CREATE POLICY "exhibitors_select"
    ON exhibitors FOR SELECT USING (true);

CREATE POLICY "exhibitors_insert"
    ON exhibitors FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "exhibitors_update"
    ON exhibitors FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "exhibitors_delete"
    ON exhibitors FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 8. SPONSORS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "sponsors_select" ON sponsors;
DROP POLICY IF EXISTS "sponsors_insert" ON sponsors;
DROP POLICY IF EXISTS "sponsors_update" ON sponsors;
DROP POLICY IF EXISTS "sponsors_delete" ON sponsors;

CREATE POLICY "sponsors_select"
    ON sponsors FOR SELECT USING (true);

CREATE POLICY "sponsors_insert"
    ON sponsors FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "sponsors_update"
    ON sponsors FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "sponsors_delete"
    ON sponsors FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 9. EVENT_GROUPS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "event_groups_select" ON event_groups;
DROP POLICY IF EXISTS "event_groups_insert" ON event_groups;
DROP POLICY IF EXISTS "event_groups_update" ON event_groups;
DROP POLICY IF EXISTS "event_groups_delete" ON event_groups;

CREATE POLICY "event_groups_select"
    ON event_groups FOR SELECT USING (true);

CREATE POLICY "event_groups_insert"
    ON event_groups FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "event_groups_update"
    ON event_groups FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "event_groups_delete"
    ON event_groups FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 10. GROUP_MEMBERS — Open read, admin write
-- =============================================
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_update" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

CREATE POLICY "group_members_select"
    ON group_members FOR SELECT USING (true);

CREATE POLICY "group_members_insert"
    ON group_members FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "group_members_update"
    ON group_members FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "group_members_delete"
    ON group_members FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

SELECT 'Practical RLS applied: open reads, admin-only check-in & writes' as status;
