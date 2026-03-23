-- Fix attendee auto-linking and join flow to handle email mismatches
-- (e.g. LinkedIn users whose primary email differs from their roster email)

-- 1. Update join_event_by_invite_code to check for existing attendees before inserting
--    This preserves badge_type (speaker/staff/vip) instead of downgrading to 'attendee'
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

    -- Check if attendee already exists by either email (handles OAuth email mismatch)
    SELECT id INTO v_existing_attendee
    FROM attendees
    WHERE event_id = v_event.id
      AND (
        LOWER(email) = LOWER(COALESCE(v_user_email, ''))
        OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
      )
    LIMIT 1;

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


-- 2. Update auto_join_by_email to also check metadata email
CREATE OR REPLACE FUNCTION auto_join_by_email()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_metadata_email TEXT;
    v_attendee RECORD;
    v_existing RECORD;
    v_joined_count INT := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'Not authenticated');
    END IF;

    SELECT email, raw_user_meta_data->>'email'
    INTO v_user_email, v_metadata_email
    FROM auth.users WHERE id = v_user_id;

    FOR v_attendee IN
        SELECT DISTINCT event_id, organization_id
        FROM attendees
        WHERE LOWER(email) = LOWER(v_user_email)
           OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
    LOOP
        SELECT id INTO v_existing
        FROM event_registrations
        WHERE event_id = v_attendee.event_id AND user_id = v_user_id;

        IF v_existing IS NULL THEN
            INSERT INTO event_registrations (event_id, user_id, organization_id)
            VALUES (v_attendee.event_id, v_user_id, v_attendee.organization_id);

            UPDATE profiles
            SET organization_id = v_attendee.organization_id, updated_at = now()
            WHERE id = v_user_id AND organization_id IS NULL;

            v_joined_count := v_joined_count + 1;
        END IF;
    END LOOP;

    RETURN json_build_object('joined_count', v_joined_count);
END;
$$;


-- 3. Update link_attendee_on_registration trigger to check both emails
CREATE OR REPLACE FUNCTION link_attendee_on_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_primary_email TEXT;
  v_metadata_email TEXT;
BEGIN
  SELECT email, raw_user_meta_data->>'email'
  INTO v_primary_email, v_metadata_email
  FROM auth.users WHERE id = NEW.user_id;

  UPDATE attendees
  SET profile_id = NEW.user_id
  WHERE event_id = NEW.event_id
    AND profile_id IS NULL
    AND (
      LOWER(email) = LOWER(v_primary_email)
      OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Update auto_link_attendee_on_profile_change to check metadata email too
CREATE OR REPLACE FUNCTION auto_link_attendee_on_profile_change()
RETURNS TRIGGER AS $$
DECLARE
  v_metadata_email TEXT;
BEGIN
  IF NEW.email IS NOT NULL THEN
    -- Also get metadata email from auth.users
    SELECT raw_user_meta_data->>'email'
    INTO v_metadata_email
    FROM auth.users WHERE id = NEW.id;

    UPDATE attendees
    SET profile_id = NEW.id
    WHERE profile_id IS NULL
      AND (
        LOWER(email) = LOWER(NEW.email)
        OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Backfill: link any unlinked attendees where metadata email matches
UPDATE attendees a
SET profile_id = u.id
FROM auth.users u
WHERE a.profile_id IS NULL
  AND u.raw_user_meta_data->>'email' IS NOT NULL
  AND LOWER(a.email) = LOWER(u.raw_user_meta_data->>'email');
