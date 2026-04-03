-- Fix duplicate attendees: when a user joins with a different email than
-- what was imported, fall back to matching by first_name + last_name.
-- Only matches if exactly ONE unlinked attendee exists with that name
-- (avoids false positives with common names).

CREATE OR REPLACE FUNCTION join_event_by_invite_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_event RECORD;
    v_user_id UUID;
    v_user RECORD;
    v_existing RECORD;
    v_existing_attendee UUID;
    v_user_email TEXT;
    v_metadata_email TEXT;
    v_name_match_count INT;
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

    -- Get user profile info and both possible emails
    SELECT p.first_name, p.last_name, p.email, p.phone, p.specialty,
           p.institution, p.title, p.credentials
    INTO v_user
    FROM profiles p
    WHERE p.id = v_user_id;

    SELECT u.email, u.raw_user_meta_data->>'email'
    INTO v_user_email, v_metadata_email
    FROM auth.users u WHERE u.id = v_user_id;

    -- Step 1: Try matching by email (handles OAuth email mismatch)
    SELECT id INTO v_existing_attendee
    FROM attendees
    WHERE event_id = v_event.id
      AND (
        LOWER(email) = LOWER(COALESCE(v_user_email, ''))
        OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
      )
    LIMIT 1;

    -- Step 2: If no email match, fall back to name match.
    -- Only if exactly ONE unlinked attendee has this name (avoid false positives).
    IF v_existing_attendee IS NULL AND v_user.first_name IS NOT NULL AND v_user.last_name IS NOT NULL THEN
        SELECT COUNT(*) INTO v_name_match_count
        FROM attendees
        WHERE event_id = v_event.id
          AND profile_id IS NULL
          AND LOWER(TRIM(first_name)) = LOWER(TRIM(v_user.first_name))
          AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_user.last_name));

        IF v_name_match_count = 1 THEN
            SELECT id INTO v_existing_attendee
            FROM attendees
            WHERE event_id = v_event.id
              AND profile_id IS NULL
              AND LOWER(TRIM(first_name)) = LOWER(TRIM(v_user.first_name))
              AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_user.last_name));
        END IF;
    END IF;

    IF v_existing_attendee IS NOT NULL THEN
        -- Link existing attendee to profile (preserves their badge_type)
        UPDATE attendees SET profile_id = v_user_id
        WHERE id = v_existing_attendee AND profile_id IS NULL;
    ELSE
        -- No existing attendee — create new one
        INSERT INTO attendees (organization_id, event_id, first_name, last_name, email,
                               phone, specialty, institution, title, credentials, badge_type,
                               profile_id)
        VALUES (
            v_event.organization_id,
            v_event.id,
            COALESCE(v_user.first_name, ''),
            COALESCE(v_user.last_name, ''),
            COALESCE(v_user_email, ''),
            v_user.phone,
            v_user.specialty,
            v_user.institution,
            v_user.title,
            v_user.credentials,
            'attendee',
            v_user_id
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN json_build_object(
        'success', true,
        'already_registered', false,
        'event_id', v_event.id,
        'event_name', v_event.name,
        'organization_id', v_event.organization_id
    );
END;
$$;
