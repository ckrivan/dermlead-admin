-- Permissive RLS policies for the events table in dev mode.
-- The admin panel uses the anon key, so we need open access for now.
-- TODO: Replace with strict RLS policies before production.

DROP POLICY IF EXISTS "Allow public read access to events" ON events;
DROP POLICY IF EXISTS "Allow public write access to events" ON events;

CREATE POLICY "Allow public read access to events"
ON events FOR SELECT USING (true);

CREATE POLICY "Allow public write access to events"
ON events FOR ALL USING (true) WITH CHECK (true);
