-- =============================================
-- ROLE-BASED RLS POLICIES
-- Replaces all dev-mode permissive policies with proper access control
--
-- Roles: admin (full CRUD in org), rep (limited per table)
-- Admin panel uses anon key + authenticated admin user = respects these policies
-- =============================================

-- =============================================
-- 1. LEADS — All org members can see all org leads
-- =============================================
DROP POLICY IF EXISTS "Public can view leads" ON leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON leads;
DROP POLICY IF EXISTS "Anyone can delete leads" ON leads;
DROP POLICY IF EXISTS "Users can view org leads" ON leads;
DROP POLICY IF EXISTS "Users can create leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Role-based lead visibility" ON leads;
DROP POLICY IF EXISTS "Users can create leads in org" ON leads;
DROP POLICY IF EXISTS "Role-based lead updates" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
DROP POLICY IF EXISTS "leads_select" ON leads;
DROP POLICY IF EXISTS "leads_insert" ON leads;
DROP POLICY IF EXISTS "leads_update" ON leads;
DROP POLICY IF EXISTS "leads_delete" ON leads;

-- All org members can see all leads in their org
CREATE POLICY "leads_select"
    ON leads FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Org members can create leads (must be captured as themselves)
CREATE POLICY "leads_insert"
    ON leads FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND captured_by = auth.uid()
    );

-- Own leads or admin in same org
CREATE POLICY "leads_update"
    ON leads FOR UPDATE
    USING (
        captured_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = leads.organization_id
        )
    );

-- Admin only delete
CREATE POLICY "leads_delete"
    ON leads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = leads.organization_id
        )
    );

-- =============================================
-- 2. ATTENDEES — Admin: full CRUD; Rep: read only
-- =============================================
DROP POLICY IF EXISTS "Allow public read access to attendees" ON attendees;
DROP POLICY IF EXISTS "Allow public write access to attendees" ON attendees;
DROP POLICY IF EXISTS "Users can view org attendees" ON attendees;
DROP POLICY IF EXISTS "Admins can create attendees" ON attendees;
DROP POLICY IF EXISTS "Admins can update attendees" ON attendees;
DROP POLICY IF EXISTS "Admins can delete attendees" ON attendees;

-- All org members can read attendees (needed for badge display / QR scan lookup)
CREATE POLICY "attendees_select"
    ON attendees FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Admin only: create attendees
CREATE POLICY "attendees_insert"
    ON attendees FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = attendees.organization_id
        )
    );

-- Admin only: update attendees (includes check-in)
CREATE POLICY "attendees_update"
    ON attendees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = attendees.organization_id
        )
    );

-- Admin only: delete attendees
CREATE POLICY "attendees_delete"
    ON attendees FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = attendees.organization_id
        )
    );

-- =============================================
-- 3. EVENTS — Admin: full CRUD; Rep: read only
-- =============================================
DROP POLICY IF EXISTS "Dev full access to events" ON events;
DROP POLICY IF EXISTS "Users can view org events" ON events;
DROP POLICY IF EXISTS "Users can create org events" ON events;
DROP POLICY IF EXISTS "Users can update org events" ON events;
DROP POLICY IF EXISTS "Admins can create events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- All org members can view events
CREATE POLICY "events_select"
    ON events FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Admin only: create events
CREATE POLICY "events_insert"
    ON events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = events.organization_id
        )
    );

-- Admin only: update events
CREATE POLICY "events_update"
    ON events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = events.organization_id
        )
    );

-- Admin only: delete events
CREATE POLICY "events_delete"
    ON events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = events.organization_id
        )
    );

-- =============================================
-- 4. SESSIONS — Admin: full CRUD; Rep: read only
-- (sessions link to events via event_id, no direct organization_id)
-- =============================================
DROP POLICY IF EXISTS "Dev full access to sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can view sessions" ON sessions;
DROP POLICY IF EXISTS "Dev read access to sessions" ON sessions;

-- All org members can view sessions (via event → org)
CREATE POLICY "sessions_select"
    ON sessions FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create sessions
CREATE POLICY "sessions_insert"
    ON sessions FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: update sessions
CREATE POLICY "sessions_update"
    ON sessions FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: delete sessions
CREATE POLICY "sessions_delete"
    ON sessions FOR DELETE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =============================================
-- 5. SESSION_SPEAKERS — Admin: full CRUD; Rep: read only
-- =============================================
DROP POLICY IF EXISTS "Dev full access to session_speakers" ON session_speakers;
DROP POLICY IF EXISTS "Anyone can view session_speakers" ON session_speakers;
DROP POLICY IF EXISTS "Dev read access to session_speakers" ON session_speakers;

-- All org members can view session_speakers (via session → event → org)
CREATE POLICY "session_speakers_select"
    ON session_speakers FOR SELECT
    USING (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN events e ON s.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create
CREATE POLICY "session_speakers_insert"
    ON session_speakers FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN events e ON s.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: update
CREATE POLICY "session_speakers_update"
    ON session_speakers FOR UPDATE
    USING (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN events e ON s.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: delete
CREATE POLICY "session_speakers_delete"
    ON session_speakers FOR DELETE
    USING (
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN events e ON s.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =============================================
-- 6. SPEAKERS — Admin: full CRUD; Rep: read only
-- =============================================
DROP POLICY IF EXISTS "Dev full access to speakers" ON speakers;
DROP POLICY IF EXISTS "Allow public write access to speakers" ON speakers;
DROP POLICY IF EXISTS "Anyone can view speakers" ON speakers;
DROP POLICY IF EXISTS "Dev read access to speakers" ON speakers;

-- All org members can view speakers (via event → org)
CREATE POLICY "speakers_select"
    ON speakers FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create speakers
CREATE POLICY "speakers_insert"
    ON speakers FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: update speakers
CREATE POLICY "speakers_update"
    ON speakers FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: delete speakers
CREATE POLICY "speakers_delete"
    ON speakers FOR DELETE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =============================================
-- 7. EXHIBITORS — Admin: full CRUD; Rep: read only
-- =============================================
DROP POLICY IF EXISTS "Allow public read access to exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public write access to exhibitors" ON exhibitors;

-- All org members can view exhibitors (via event → org)
CREATE POLICY "exhibitors_select"
    ON exhibitors FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create exhibitors
CREATE POLICY "exhibitors_insert"
    ON exhibitors FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: update exhibitors
CREATE POLICY "exhibitors_update"
    ON exhibitors FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: delete exhibitors
CREATE POLICY "exhibitors_delete"
    ON exhibitors FOR DELETE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =============================================
-- 8. SPONSORS — Admin: full CRUD; Rep: read only
-- =============================================
DROP POLICY IF EXISTS "Allow public read access to sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow public write access to sponsors" ON sponsors;

-- All org members can view sponsors (via event → org)
CREATE POLICY "sponsors_select"
    ON sponsors FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create sponsors
CREATE POLICY "sponsors_insert"
    ON sponsors FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: update sponsors
CREATE POLICY "sponsors_update"
    ON sponsors FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Admin only: delete sponsors
CREATE POLICY "sponsors_delete"
    ON sponsors FOR DELETE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =============================================
-- 9. EVENT_GROUPS — Admin: full CRUD; Others: read only
-- =============================================
DROP POLICY IF EXISTS "Allow public access to event_groups" ON event_groups;

-- Authenticated users can view groups (via event → org)
CREATE POLICY "event_groups_select"
    ON event_groups FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create groups
CREATE POLICY "event_groups_insert"
    ON event_groups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin only: update groups
CREATE POLICY "event_groups_update"
    ON event_groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin only: delete groups
CREATE POLICY "event_groups_delete"
    ON event_groups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 10. GROUP_MEMBERS — Admin: full CRUD; Others: read only
-- =============================================
DROP POLICY IF EXISTS "Allow public access to group_members" ON group_members;

-- Authenticated users can view group members
CREATE POLICY "group_members_select"
    ON group_members FOR SELECT
    USING (
        group_id IN (
            SELECT eg.id FROM event_groups eg
            JOIN events e ON eg.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

-- Admin only: create group members
CREATE POLICY "group_members_insert"
    ON group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin only: update group members
CREATE POLICY "group_members_update"
    ON group_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin only: delete group members
CREATE POLICY "group_members_delete"
    ON group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- DONE
-- =============================================
SELECT 'Role-based RLS policies applied! Dev mode disabled.' as status;
