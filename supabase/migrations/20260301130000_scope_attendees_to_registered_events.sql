-- =============================================
-- SCOPE ATTENDEES TO REGISTERED EVENTS ONLY
--
-- Problem: After joining via invite code, attendees get org_id on their profile
-- which gives them access to ALL events in the org via the org-scoped policies.
--
-- Fix: Attendees only see events (and child data) they explicitly registered for.
-- Admins/reps keep full org-wide access.
--
-- Tables affected (SELECT policies only):
--   1. events
--   2. attendees
--   3. sessions
--   4. session_speakers
--   5. speakers
--   6. exhibitors
--   7. sponsors
--   8. event_groups
--   9. group_members
-- =============================================

-- =============================================
-- 1. EVENTS — Admins/reps see org events; attendees see registered events only
-- =============================================
DROP POLICY IF EXISTS "events_select" ON events;

CREATE POLICY "events_select"
    ON events FOR SELECT
    USING (
        -- Admins/reps: all events in their org
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'rep')
            AND organization_id = events.organization_id
        )
        OR
        -- Attendees: only events they registered for
        id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 2. ATTENDEES — Same scoping pattern
-- =============================================
DROP POLICY IF EXISTS "attendees_select" ON attendees;

CREATE POLICY "attendees_select"
    ON attendees FOR SELECT
    USING (
        -- Admins/reps: all attendees in their org
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'rep')
            AND organization_id = attendees.organization_id
        )
        OR
        -- Attendees: only for events they registered for
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 3. SESSIONS — Scoped via event_id
-- =============================================
DROP POLICY IF EXISTS "sessions_select" ON sessions;

CREATE POLICY "sessions_select"
    ON sessions FOR SELECT
    USING (
        -- Admins/reps: all sessions for org events
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: sessions for registered events
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 4. SESSION_SPEAKERS — Scoped via session -> event
-- =============================================
DROP POLICY IF EXISTS "session_speakers_select" ON session_speakers;

CREATE POLICY "session_speakers_select"
    ON session_speakers FOR SELECT
    USING (
        -- Admins/reps: via org
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN events e ON s.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: via registration
        session_id IN (
            SELECT s.id FROM sessions s
            JOIN event_registrations er ON s.event_id = er.event_id
            WHERE er.user_id = auth.uid()
        )
    );

-- =============================================
-- 5. SPEAKERS — Scoped via event_id
-- =============================================
DROP POLICY IF EXISTS "speakers_select" ON speakers;

CREATE POLICY "speakers_select"
    ON speakers FOR SELECT
    USING (
        -- Admins/reps: all speakers for org events
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: speakers for registered events
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 6. EXHIBITORS — Scoped via event_id
-- =============================================
DROP POLICY IF EXISTS "exhibitors_select" ON exhibitors;

CREATE POLICY "exhibitors_select"
    ON exhibitors FOR SELECT
    USING (
        -- Admins/reps: all exhibitors for org events
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: exhibitors for registered events
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 7. SPONSORS — Scoped via event_id
-- =============================================
DROP POLICY IF EXISTS "sponsors_select" ON sponsors;

CREATE POLICY "sponsors_select"
    ON sponsors FOR SELECT
    USING (
        -- Admins/reps: all sponsors for org events
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: sponsors for registered events
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 8. EVENT_GROUPS — Scoped via event_id
-- =============================================
DROP POLICY IF EXISTS "event_groups_select" ON event_groups;

CREATE POLICY "event_groups_select"
    ON event_groups FOR SELECT
    USING (
        -- Admins/reps: all groups for org events
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: groups for registered events
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 9. GROUP_MEMBERS — Scoped via group -> event
-- =============================================
DROP POLICY IF EXISTS "group_members_select" ON group_members;

CREATE POLICY "group_members_select"
    ON group_members FOR SELECT
    USING (
        -- Admins/reps: via org
        group_id IN (
            SELECT eg.id FROM event_groups eg
            JOIN events e ON eg.event_id = e.id
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'rep')
        )
        OR
        -- Attendees: via registration
        group_id IN (
            SELECT eg.id FROM event_groups eg
            JOIN event_registrations er ON eg.event_id = er.event_id
            WHERE er.user_id = auth.uid()
        )
    );

-- =============================================
-- NOTE: leads_select is NOT changed — leads are org-scoped for reps/admins.
-- Attendees don't access leads.
-- conversations/messages are user-scoped (participant check), not affected.
-- =============================================

SELECT 'Attendee event scoping complete. Attendees now only see registered events.' as status;
