-- Dev/Demo: Allow public read access to events and sessions
-- This enables testing without authentication

-- Events: Allow anyone to read events (for demo/dev)
CREATE POLICY "Public can view events"
    ON events FOR SELECT
    USING (true);

-- Sessions: Allow anyone to read sessions (for demo/dev)
CREATE POLICY "Public can view sessions"
    ON sessions FOR SELECT
    USING (true);

-- Session speakers: Allow anyone to read (for demo/dev)
CREATE POLICY "Public can view all session speakers"
    ON session_speakers FOR SELECT
    USING (true);

-- Speakers: Allow anyone to read speakers (for demo/dev)
CREATE POLICY "Public can view speakers"
    ON speakers FOR SELECT
    USING (true);

SELECT 'Dev public access policies created!' as status;
