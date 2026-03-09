-- Fix: Make leads visible to ALL org members (not just admin + own)
-- Check-in remains admin-only (attendees_update policy unchanged)

-- Drop the restrictive leads_select and recreate as org-wide
DROP POLICY IF EXISTS "leads_select" ON leads;

CREATE POLICY "leads_select"
    ON leads FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

SELECT 'Fixed: All org members can now see all org leads' as status;
