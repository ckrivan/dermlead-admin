-- Fix events RLS: the April 1 migration (20260401140000) replaced scoped access
-- with "any authenticated user sees all non-archived events."
-- This restores proper scoping: users only see events they've registered for.
-- Admin panel still works because admins get org-wide access.

-- Drop the broken policies from 20260401140000
DROP POLICY IF EXISTS "read_active_events" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

-- Events SELECT:
-- Admins/reps: all events in their org (admin panel needs this)
-- Everyone else: only events they registered for via invite code, not archived
CREATE POLICY "events_select" ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'rep')
      AND organization_id = events.organization_id
    )
    OR
    (
      archived_at IS NULL
      AND id IN (
        SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
      )
    )
  );

-- Write policies: only admins/reps in the same org
CREATE POLICY "events_insert" ON events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'rep')
    )
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'rep')
      AND organization_id = events.organization_id
    )
  );

CREATE POLICY "events_delete" ON events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'rep')
      AND organization_id = events.organization_id
    )
  );
