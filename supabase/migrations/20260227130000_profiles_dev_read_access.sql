-- DEV MODE: Allow public read access to profiles for admin panel operations.
-- The admin panel needs to look up profiles by email to auto-link attendees.
-- Before production: remove this and rely on authenticated-only policies.
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;

CREATE POLICY "Allow public read access to profiles"
ON profiles FOR SELECT USING (true);
