-- DEV MODE: Add permissive CRUD policies for all admin-managed tables
-- This allows the admin panel (using anon key) to create, update, and delete records
-- ⚠️ REVERT TO STRICT POLICIES BEFORE PRODUCTION

-- SESSIONS: Add full CRUD (currently only SELECT)
DROP POLICY IF EXISTS "Dev full access to sessions" ON sessions;
CREATE POLICY "Dev full access to sessions"
ON sessions FOR ALL USING (true) WITH CHECK (true);

-- SESSION_SPEAKERS: Add full CRUD (currently only SELECT)
DROP POLICY IF EXISTS "Dev full access to session_speakers" ON session_speakers;
CREATE POLICY "Dev full access to session_speakers"
ON session_speakers FOR ALL USING (true) WITH CHECK (true);

-- EVENTS: Add full CRUD (currently only SELECT)
DROP POLICY IF EXISTS "Dev full access to events" ON events;
CREATE POLICY "Dev full access to events"
ON events FOR ALL USING (true) WITH CHECK (true);

-- SPEAKERS: Ensure full CRUD exists
DROP POLICY IF EXISTS "Dev full access to speakers" ON speakers;
CREATE POLICY "Dev full access to speakers"
ON speakers FOR ALL USING (true) WITH CHECK (true);

SELECT 'Dev CRUD policies applied to all tables!' as status;
