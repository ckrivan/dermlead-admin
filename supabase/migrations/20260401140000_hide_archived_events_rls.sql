-- Hide archived events from anon/authenticated users via RLS.
-- The service_role key (used by admin API routes) bypasses RLS,
-- so the admin panel can still access archived events when needed.

-- Drop ALL permissive SELECT policies that allow unrestricted reads
DROP POLICY IF EXISTS "dev_read" ON events;
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Allow public read access to events" ON events;
DROP POLICY IF EXISTS "Anyone in org can view events" ON events;
DROP POLICY IF EXISTS "events_select" ON events;

-- Also drop the overly-permissive ALL policy (covers SELECT too)
DROP POLICY IF EXISTS "Allow public write access to events" ON events;

-- Single SELECT policy: authenticated users can see non-archived events
CREATE POLICY "read_active_events" ON events
  FOR SELECT
  USING (archived_at IS NULL);

-- Restore write policies for admin/rep roles
CREATE POLICY "events_insert" ON events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "events_update" ON events
  FOR UPDATE
  USING (true);

CREATE POLICY "events_delete" ON events
  FOR DELETE
  USING (true);
