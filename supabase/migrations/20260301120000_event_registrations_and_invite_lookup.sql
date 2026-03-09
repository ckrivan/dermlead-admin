-- =============================================
-- EVENT REGISTRATIONS + INVITE CODE LOOKUP
-- =============================================

-- 1. Create event_registrations table (drop if exists from partial previous run)
DROP TABLE IF EXISTS event_registrations CASCADE;
CREATE TABLE event_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    registered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent duplicate registrations
    UNIQUE(event_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can see their own registrations
DROP POLICY IF EXISTS "registrations_select_own" ON event_registrations;
CREATE POLICY "registrations_select_own"
    ON event_registrations FOR SELECT
    USING (user_id = auth.uid());

-- Admins can see all registrations in their org
DROP POLICY IF EXISTS "registrations_select_admin" ON event_registrations;
CREATE POLICY "registrations_select_admin"
    ON event_registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = event_registrations.organization_id
        )
    );

-- Users can register themselves (insert their own row)
DROP POLICY IF EXISTS "registrations_insert_self" ON event_registrations;
CREATE POLICY "registrations_insert_self"
    ON event_registrations FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own registrations (leave event)
DROP POLICY IF EXISTS "registrations_delete_own" ON event_registrations;
CREATE POLICY "registrations_delete_own"
    ON event_registrations FOR DELETE
    USING (user_id = auth.uid());

-- Admins can delete any registration in their org
DROP POLICY IF EXISTS "registrations_delete_admin" ON event_registrations;
CREATE POLICY "registrations_delete_admin"
    ON event_registrations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND organization_id = event_registrations.organization_id
        )
    );


-- 2. RPC: Look up event by invite code (bypasses RLS via SECURITY DEFINER)
--    Returns minimal public event info for the join confirmation screen.
--    Granted to both authenticated and anon (code-first flow is pre-auth).
CREATE OR REPLACE FUNCTION lookup_event_by_invite_code(code TEXT)
RETURNS TABLE (
    event_id UUID,
    event_name TEXT,
    organization_id UUID,
    start_date DATE,
    end_date DATE,
    location TEXT,
    banner_url TEXT,
    logo_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        e.id AS event_id,
        e.name AS event_name,
        e.organization_id,
        e.start_date::DATE,
        e.end_date::DATE,
        e.location,
        e.banner_url,
        e.logo_url
    FROM events e
    WHERE UPPER(TRIM(e.invite_code)) = UPPER(TRIM(code))
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION lookup_event_by_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION lookup_event_by_invite_code(TEXT) TO anon;


-- 3. RPC: Join event by invite code (authenticated only)
--    Atomically creates registration AND assigns org to profile if missing.
CREATE OR REPLACE FUNCTION join_event_by_invite_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_user_id UUID;
    v_existing RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'Not authenticated');
    END IF;

    -- Look up the event
    SELECT id, name, organization_id
    INTO v_event
    FROM events
    WHERE UPPER(TRIM(invite_code)) = UPPER(TRIM(code));

    IF v_event IS NULL THEN
        RETURN json_build_object('error', 'Invalid invite code');
    END IF;

    -- Check if already registered
    SELECT id INTO v_existing
    FROM event_registrations
    WHERE event_id = v_event.id AND user_id = v_user_id;

    IF v_existing IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'already_registered', true,
            'event_id', v_event.id,
            'event_name', v_event.name
        );
    END IF;

    -- Create registration
    INSERT INTO event_registrations (event_id, user_id, organization_id)
    VALUES (v_event.id, v_user_id, v_event.organization_id);

    -- Update user profile org if they don't have one yet
    UPDATE profiles
    SET organization_id = v_event.organization_id,
        updated_at = now()
    WHERE id = v_user_id
    AND organization_id IS NULL;

    RETURN json_build_object(
        'success', true,
        'already_registered', false,
        'event_id', v_event.id,
        'event_name', v_event.name,
        'organization_id', v_event.organization_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION join_event_by_invite_code(TEXT) TO authenticated;


-- 4. Update events_select to also allow registered users to see their joined events
DROP POLICY IF EXISTS "events_select" ON events;

CREATE POLICY "events_select"
    ON events FOR SELECT
    USING (
        -- Org members can see events
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR
        -- Registered users can see events they joined
        id IN (
            SELECT event_id FROM event_registrations WHERE user_id = auth.uid()
        )
    );
