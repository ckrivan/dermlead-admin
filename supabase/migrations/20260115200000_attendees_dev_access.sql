-- Enable permissive read access for attendees (DEV MODE)
-- WARNING: Revert before production

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to attendees" ON attendees;
DROP POLICY IF EXISTS "Allow public write access to attendees" ON attendees;

-- Allow anyone to read attendees
CREATE POLICY "Allow public read access to attendees"
ON attendees FOR SELECT
USING (true);

-- Allow anyone to insert/update/delete attendees
CREATE POLICY "Allow public write access to attendees"
ON attendees FOR ALL
USING (true)
WITH CHECK (true);
