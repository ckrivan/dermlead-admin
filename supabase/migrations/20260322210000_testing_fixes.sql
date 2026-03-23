-- Testing fixes migration
-- 1. Add is_anonymous to session_questions
ALTER TABLE session_questions ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 2. Update join_event_by_invite_code to set badge_type based on profile role
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
    v_profile_role TEXT;
    v_badge_type TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'Not authenticated');
    END IF;

    SELECT id, name, organization_id
    INTO v_event
    FROM events
    WHERE UPPER(TRIM(invite_code)) = UPPER(TRIM(code));

    IF v_event IS NULL THEN
        RETURN json_build_object('error', 'Invalid invite code');
    END IF;

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

    INSERT INTO event_registrations (event_id, user_id, organization_id)
    VALUES (v_event.id, v_user_id, v_event.organization_id);

    UPDATE profiles
    SET organization_id = v_event.organization_id, updated_at = now()
    WHERE id = v_user_id AND organization_id IS NULL;

    -- Get profile role to determine badge_type
    SELECT role INTO v_profile_role FROM profiles WHERE id = v_user_id;

    -- Map profile role to badge_type
    v_badge_type := CASE
        WHEN v_profile_role = 'rep' THEN 'industry'
        WHEN v_profile_role = 'admin' THEN 'organiser'
        WHEN v_profile_role = 'organiser' THEN 'organiser'
        WHEN v_profile_role = 'leadership' THEN 'leadership'
        ELSE 'attendee'
    END;

    SELECT p.first_name, p.last_name, p.email, p.phone, p.specialty,
           p.institution, p.title, p.credentials
    INTO v_user
    FROM profiles p
    WHERE p.id = v_user_id;

    SELECT u.email, u.raw_user_meta_data->>'email'
    INTO v_user_email, v_metadata_email
    FROM auth.users u WHERE u.id = v_user_id;

    -- Check if attendee already exists by either email
    SELECT id INTO v_existing_attendee
    FROM attendees
    WHERE event_id = v_event.id
      AND (
        LOWER(email) = LOWER(COALESCE(v_user_email, ''))
        OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
      )
    LIMIT 1;

    IF v_existing_attendee IS NOT NULL THEN
        UPDATE attendees SET profile_id = v_user_id
        WHERE id = v_existing_attendee AND profile_id IS NULL;
    ELSE
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
            v_badge_type,
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

-- 3. Ensure tables are in realtime publication (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE session_questions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE event_photos;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
