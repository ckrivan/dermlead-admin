-- =============================================
-- PRODUCTION RLS TIGHTENING
-- Removes all dev-mode bypasses (OR true, auth.uid() IS NULL)
-- Restores org-scoped policies that were overwritten by practical_rls
--
-- Tables affected:
--   1. leads (restore org-scoped from role_based_rls)
--   2. attendees (restore org-scoped)
--   3. events (restore org-scoped)
--   4. sessions, session_speakers, speakers (restore org-scoped)
--   5. exhibitors, sponsors (restore org-scoped)
--   6. event_groups, group_members (restore org-scoped)
--   7. conversations, messages (remove auth.uid() IS NULL)
--   8. community_posts, post_comments (remove OR true)
--   9. session_questions (remove OR true)
--  10. event_photos (remove OR true)
-- =============================================

-- =============================================
-- 1. LEADS — Org-scoped access, rep sees own + org, admin full CRUD
-- =============================================
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
-- 2. ATTENDEES — Org-scoped, admin-only write
-- =============================================
DROP POLICY IF EXISTS "attendees_select" ON attendees;
DROP POLICY IF EXISTS "attendees_insert" ON attendees;
DROP POLICY IF EXISTS "attendees_update" ON attendees;
DROP POLICY IF EXISTS "attendees_delete" ON attendees;

CREATE POLICY "attendees_select"
    ON attendees FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

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
-- 3. EVENTS — Org-scoped, admin-only write
-- =============================================
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

CREATE POLICY "events_select"
    ON events FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

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
-- 4. SESSIONS — Org-scoped via event, admin-only write
-- =============================================
DROP POLICY IF EXISTS "sessions_select" ON sessions;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;
DROP POLICY IF EXISTS "sessions_delete" ON sessions;

CREATE POLICY "sessions_select"
    ON sessions FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "sessions_insert"
    ON sessions FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "sessions_update"
    ON sessions FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

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
-- 5. SESSION_SPEAKERS — Org-scoped via session->event
-- =============================================
DROP POLICY IF EXISTS "session_speakers_select" ON session_speakers;
DROP POLICY IF EXISTS "session_speakers_insert" ON session_speakers;
DROP POLICY IF EXISTS "session_speakers_update" ON session_speakers;
DROP POLICY IF EXISTS "session_speakers_delete" ON session_speakers;

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
-- 6. SPEAKERS — Org-scoped via event
-- =============================================
DROP POLICY IF EXISTS "speakers_select" ON speakers;
DROP POLICY IF EXISTS "speakers_insert" ON speakers;
DROP POLICY IF EXISTS "speakers_update" ON speakers;
DROP POLICY IF EXISTS "speakers_delete" ON speakers;

CREATE POLICY "speakers_select"
    ON speakers FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "speakers_insert"
    ON speakers FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "speakers_update"
    ON speakers FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

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
-- 7. EXHIBITORS — Org-scoped via event
-- =============================================
DROP POLICY IF EXISTS "exhibitors_select" ON exhibitors;
DROP POLICY IF EXISTS "exhibitors_insert" ON exhibitors;
DROP POLICY IF EXISTS "exhibitors_update" ON exhibitors;
DROP POLICY IF EXISTS "exhibitors_delete" ON exhibitors;

CREATE POLICY "exhibitors_select"
    ON exhibitors FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "exhibitors_insert"
    ON exhibitors FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "exhibitors_update"
    ON exhibitors FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

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
-- 8. SPONSORS — Org-scoped via event
-- =============================================
DROP POLICY IF EXISTS "sponsors_select" ON sponsors;
DROP POLICY IF EXISTS "sponsors_insert" ON sponsors;
DROP POLICY IF EXISTS "sponsors_update" ON sponsors;
DROP POLICY IF EXISTS "sponsors_delete" ON sponsors;

CREATE POLICY "sponsors_select"
    ON sponsors FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "sponsors_insert"
    ON sponsors FOR INSERT
    WITH CHECK (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "sponsors_update"
    ON sponsors FOR UPDATE
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

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
-- 9. EVENT_GROUPS — Org-scoped via event
-- =============================================
DROP POLICY IF EXISTS "event_groups_select" ON event_groups;
DROP POLICY IF EXISTS "event_groups_insert" ON event_groups;
DROP POLICY IF EXISTS "event_groups_update" ON event_groups;
DROP POLICY IF EXISTS "event_groups_delete" ON event_groups;

CREATE POLICY "event_groups_select"
    ON event_groups FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "event_groups_insert"
    ON event_groups FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "event_groups_update"
    ON event_groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "event_groups_delete"
    ON event_groups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 10. GROUP_MEMBERS — Org-scoped
-- =============================================
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_update" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

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

CREATE POLICY "group_members_insert"
    ON group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "group_members_update"
    ON group_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "group_members_delete"
    ON group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- 11. CONVERSATIONS — Require authentication (remove IS NULL bypass)
-- =============================================
DROP POLICY IF EXISTS "conversations_select" ON conversations;
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;

CREATE POLICY "conversations_select" ON conversations FOR SELECT
USING (
    auth.uid() = participant_1
    OR auth.uid() = participant_2
);

CREATE POLICY "conversations_insert" ON conversations FOR INSERT
WITH CHECK (
    auth.uid() = participant_1
    OR auth.uid() = participant_2
);

CREATE POLICY "conversations_update" ON conversations FOR UPDATE
USING (
    auth.uid() = participant_1
    OR auth.uid() = participant_2
);

-- =============================================
-- 12. MESSAGES — Require authentication (remove IS NULL bypass)
-- =============================================
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

CREATE POLICY "messages_select" ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE participant_1 = auth.uid()
           OR participant_2 = auth.uid()
    )
);

CREATE POLICY "messages_insert" ON messages FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE participant_1 = auth.uid()
           OR participant_2 = auth.uid()
    )
);

CREATE POLICY "messages_update" ON messages FOR UPDATE
USING (sender_id = auth.uid());

-- =============================================
-- 13. COMMUNITY_POSTS — Require authentication (remove OR true)
-- =============================================
DROP POLICY IF EXISTS "community_posts_insert" ON community_posts;

CREATE POLICY "community_posts_insert"
    ON community_posts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 14. POST_COMMENTS — Require authentication (remove OR true)
-- =============================================
DROP POLICY IF EXISTS "post_comments_insert" ON post_comments;

CREATE POLICY "post_comments_insert"
    ON post_comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 15. SESSION_QUESTIONS — Require authentication (remove OR true)
-- =============================================
DROP POLICY IF EXISTS "session_questions_insert" ON session_questions;

CREATE POLICY "session_questions_insert" ON session_questions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 16. EVENT_PHOTOS — Require authentication (remove OR true)
-- =============================================
DROP POLICY IF EXISTS "event_photos_insert" ON event_photos;

CREATE POLICY "event_photos_insert" ON event_photos FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- DONE
-- =============================================
SELECT 'Production RLS tightening complete. All dev bypasses removed.' as status;
