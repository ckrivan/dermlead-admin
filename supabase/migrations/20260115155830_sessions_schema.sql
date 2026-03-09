-- Converge Platform: Sessions & Agenda Schema
-- Sprint A: Sessions Foundation

-- Enable UUID extension (Supabase usually has this, but just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. SESSIONS TABLE
-- Conference sessions/talks/workshops
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Session Info
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT[], -- Learning objectives as array
    session_type TEXT DEFAULT 'presentation' CHECK (session_type IN (
        'presentation', 'workshop', 'panel', 'keynote', 'breakout',
        'networking', 'meal', 'break', 'exhibition', 'other'
    )),

    -- Schedule
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Location
    location TEXT, -- Room name
    location_details TEXT, -- Additional directions

    -- Capacity & Registration
    capacity INTEGER, -- NULL = unlimited
    requires_registration BOOLEAN DEFAULT FALSE,

    -- Display
    is_highlighted BOOLEAN DEFAULT FALSE, -- Featured session
    track TEXT, -- e.g., "Clinical", "Business", "Research"

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_event ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(event_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track);

-- =============================================
-- 2. SESSION_SPEAKERS TABLE
-- Links speakers (profiles) to sessions
-- =============================================
CREATE TABLE IF NOT EXISTS session_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Speaker role in this session
    role TEXT DEFAULT 'speaker' CHECK (role IN ('speaker', 'moderator', 'panelist', 'host')),
    display_order INTEGER DEFAULT 0, -- For ordering multiple speakers

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id, speaker_id)
);

CREATE INDEX IF NOT EXISTS idx_session_speakers_session ON session_speakers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_speakers_speaker ON session_speakers(speaker_id);

-- =============================================
-- 3. USER_AGENDA TABLE
-- User's saved/favorited sessions
-- =============================================
CREATE TABLE IF NOT EXISTS user_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

    -- Optional: registration status for sessions that require it
    registered BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_agenda_user ON user_agenda(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agenda_session ON user_agenda(session_id);

-- =============================================
-- 4. EXTEND PROFILES FOR SPEAKERS
-- Add speaker-specific fields if not exists
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credentials TEXT; -- e.g., "MD, FAAD"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT; -- Job title
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_speaker BOOLEAN DEFAULT FALSE;

-- =============================================
-- 5. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agenda ENABLE ROW LEVEL SECURITY;

-- SESSIONS: Anyone authenticated can view sessions for events they have access to
CREATE POLICY "Users can view sessions for accessible events"
    ON sessions FOR SELECT
    USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE p.id = auth.uid()
        )
        OR
        event_id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );

-- SESSIONS: Only admins can manage sessions
CREATE POLICY "Admins can manage sessions"
    ON sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN events e ON e.organization_id = p.organization_id
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
            AND e.id = sessions.event_id
        )
    );

-- SESSION_SPEAKERS: Anyone can view speaker assignments
CREATE POLICY "Users can view session speakers"
    ON session_speakers FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM sessions
        )
    );

-- SESSION_SPEAKERS: Only admins can manage
CREATE POLICY "Admins can manage session speakers"
    ON session_speakers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN events e ON e.organization_id = p.organization_id
            JOIN sessions s ON s.event_id = e.id
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
            AND s.id = session_speakers.session_id
        )
    );

-- USER_AGENDA: Users can manage their own agenda
CREATE POLICY "Users can view own agenda"
    ON user_agenda FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can add to own agenda"
    ON user_agenda FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own agenda"
    ON user_agenda FOR DELETE
    USING (user_id = auth.uid());

-- =============================================
-- 6. TRIGGERS
-- =============================================

-- Auto-update updated_at for sessions
CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 7. VIEWS FOR CONVENIENCE
-- =============================================

-- View: Sessions with speaker count
CREATE OR REPLACE VIEW sessions_with_speakers AS
SELECT
    s.*,
    COUNT(ss.id) as speaker_count,
    ARRAY_AGG(p.full_name ORDER BY ss.display_order) FILTER (WHERE p.full_name IS NOT NULL) as speaker_names
FROM sessions s
LEFT JOIN session_speakers ss ON ss.session_id = s.id
LEFT JOIN profiles p ON p.id = ss.speaker_id
GROUP BY s.id;

-- View: User agenda with session details
CREATE OR REPLACE VIEW user_agenda_details AS
SELECT
    ua.user_id,
    ua.registered,
    s.*
FROM user_agenda ua
JOIN sessions s ON s.id = ua.session_id;

-- =============================================
-- DONE
-- =============================================
SELECT 'Sessions schema ready!' as status;
