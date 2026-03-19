-- Add badge_template JSONB column to events for per-event Avery template config
ALTER TABLE events ADD COLUMN IF NOT EXISTS badge_template JSONB;

-- Dev-mode: ensure events table still has permissive RLS
DROP POLICY IF EXISTS "Allow public read access to events" ON events;
DROP POLICY IF EXISTS "Allow public write access to events" ON events;

CREATE POLICY "Allow public read access to events"
ON events FOR SELECT USING (true);

CREATE POLICY "Allow public write access to events"
ON events FOR ALL USING (true) WITH CHECK (true);
