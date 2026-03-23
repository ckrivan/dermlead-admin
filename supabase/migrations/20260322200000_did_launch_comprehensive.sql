-- ============================================================
-- DID Launch Comprehensive Migration
-- Covers: staff→organiser rename, badge type cleanup, indexes,
-- messaging FK drop, lead retrieval flags, session_id on leads,
-- auto-link 3-tier matching, password requirements
-- ============================================================

-- 1. DROP BADGE TYPE CONSTRAINT FIRST (must happen before renaming values)
ALTER TABLE attendees DROP CONSTRAINT IF EXISTS attendees_badge_type_check;

-- 2. RENAME staff → organiser IN ATTENDEES
UPDATE attendees SET badge_type = 'organiser' WHERE badge_type = 'staff';
-- Clean up invalid badge types
UPDATE attendees SET badge_type = 'attendee' WHERE badge_type IN ('guest', 'press', 'vip');

-- 3. ADD NEW BADGE TYPE CONSTRAINT
ALTER TABLE attendees ADD CONSTRAINT attendees_badge_type_check
    CHECK (badge_type IN ('attendee', 'industry', 'speaker', 'exhibitor', 'sponsor', 'leadership', 'organiser'));

-- 3. RENAME staff → organiser IN PROFILES ROLE
UPDATE profiles SET role = 'organiser' WHERE role = 'staff';

-- Update profiles role constraint to include organiser
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'rep', 'attendee', 'leadership', 'organiser', 'auditor'));

-- 4. DATABASE INDEXES (safe, high impact)
CREATE INDEX IF NOT EXISTS idx_attendees_event ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_profile ON attendees(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_leads_event ON leads(event_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_captured_by ON leads(captured_by);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- 5. MESSAGING — DROP FK ON CONVERSATION PARTICIPANTS
-- Allow attendee UUIDs as participant placeholders for queued messaging
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_1_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_2_fkey;

-- Trigger: when attendee gets profile_id, swap attendee_id → profile_id in conversations
CREATE OR REPLACE FUNCTION migrate_conversations_on_profile_link()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.profile_id IS NULL AND NEW.profile_id IS NOT NULL THEN
    UPDATE conversations
    SET participant_1 = NEW.profile_id
    WHERE participant_1 = OLD.id;

    UPDATE conversations
    SET participant_2 = NEW.profile_id
    WHERE participant_2 = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_migrate_conversations_on_profile_link ON attendees;
CREATE TRIGGER trg_migrate_conversations_on_profile_link
AFTER UPDATE OF profile_id ON attendees
FOR EACH ROW
EXECUTE FUNCTION migrate_conversations_on_profile_link();

-- 6. LEAD RETRIEVAL — ADD session_id AND lead_access per-user flag
ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);

-- Lead access: per-user flag for who can capture leads
-- Uses existing lead_access_companies for company-level access
-- Add per-user override
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS lead_access_granted BOOLEAN DEFAULT false;

-- 7. AUTO-LINK 3-TIER MATCHING
-- Update auto_join_by_email to also match by NPI and name+domain
CREATE OR REPLACE FUNCTION auto_join_by_email()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_metadata_email TEXT;
    v_user_npi TEXT;
    v_user_first TEXT;
    v_user_last TEXT;
    v_user_domain TEXT;
    v_attendee RECORD;
    v_existing RECORD;
    v_joined_count INT := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'Not authenticated');
    END IF;

    -- Get user's emails
    SELECT email, raw_user_meta_data->>'email'
    INTO v_user_email, v_metadata_email
    FROM auth.users WHERE id = v_user_id;

    -- Get user's profile data for tier 2 and 3 matching
    SELECT first_name, last_name, npi_number
    INTO v_user_first, v_user_last, v_user_npi
    FROM (
        SELECT p.first_name, p.last_name, a.npi_number
        FROM profiles p
        LEFT JOIN attendees a ON a.profile_id = p.id
        WHERE p.id = v_user_id
        LIMIT 1
    ) sub;

    -- Extract email domain for tier 3
    v_user_domain := SPLIT_PART(LOWER(v_user_email), '@', 2);

    FOR v_attendee IN
        SELECT DISTINCT event_id, organization_id
        FROM attendees
        WHERE
            -- Tier 1: Email match (primary or metadata)
            LOWER(email) = LOWER(v_user_email)
            OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
            -- Tier 2: NPI match
            OR (v_user_npi IS NOT NULL AND v_user_npi != '' AND npi_number = v_user_npi)
            -- Tier 3: First + Last + same email domain
            OR (
                v_user_first IS NOT NULL AND v_user_last IS NOT NULL
                AND LOWER(first_name) = LOWER(v_user_first)
                AND LOWER(last_name) = LOWER(v_user_last)
                AND SPLIT_PART(LOWER(email), '@', 2) = v_user_domain
            )
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

-- Update link_attendee_on_registration with 3-tier matching
CREATE OR REPLACE FUNCTION link_attendee_on_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_primary_email TEXT;
  v_metadata_email TEXT;
  v_user_npi TEXT;
  v_user_first TEXT;
  v_user_last TEXT;
  v_user_domain TEXT;
BEGIN
  SELECT email, raw_user_meta_data->>'email'
  INTO v_primary_email, v_metadata_email
  FROM auth.users WHERE id = NEW.user_id;

  -- Get profile data for tier 2/3
  SELECT first_name, last_name
  INTO v_user_first, v_user_last
  FROM profiles WHERE id = NEW.user_id;

  v_user_domain := SPLIT_PART(LOWER(v_primary_email), '@', 2);

  UPDATE attendees
  SET profile_id = NEW.user_id
  WHERE event_id = NEW.event_id
    AND profile_id IS NULL
    AND (
      -- Tier 1: Email match
      LOWER(email) = LOWER(v_primary_email)
      OR (v_metadata_email IS NOT NULL AND LOWER(email) = LOWER(v_metadata_email))
      -- Tier 2: NPI match (check if user has NPI from another attendee record)
      OR (npi_number IS NOT NULL AND npi_number != '' AND npi_number IN (
          SELECT a2.npi_number FROM attendees a2 WHERE a2.profile_id = NEW.user_id AND a2.npi_number IS NOT NULL
      ))
      -- Tier 3: First + Last + same domain
      OR (
          v_user_first IS NOT NULL AND v_user_last IS NOT NULL
          AND LOWER(first_name) = LOWER(v_user_first)
          AND LOWER(last_name) = LOWER(v_user_last)
          AND SPLIT_PART(LOWER(email), '@', 2) = v_user_domain
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update auto_link_attendee_on_profile_change with metadata email
CREATE OR REPLACE FUNCTION auto_link_attendee_on_profile_change()
RETURNS TRIGGER AS $$
DECLARE
  v_metadata_email TEXT;
BEGIN
  IF NEW.email IS NOT NULL THEN
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

-- 8. UPDATE join_event_by_invite_code — use organiser instead of staff
-- (Already updated in previous migration to preserve badge_type, just ensuring consistency)

-- 9. FIX delete_my_account — uses wrong column name
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete leads captured by this user
    DELETE FROM leads WHERE captured_by = v_user_id;

    -- Delete messages sent by this user
    DELETE FROM messages WHERE sender_id = v_user_id;

    -- Delete conversations involving this user
    DELETE FROM conversations WHERE participant_1 = v_user_id OR participant_2 = v_user_id;

    -- Clear attendee profile links
    UPDATE attendees SET profile_id = NULL WHERE profile_id = v_user_id;

    -- Delete event registrations
    DELETE FROM event_registrations WHERE user_id = v_user_id;

    -- Delete the profile (cascades from auth.users delete)
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- 10. CLEAN UP TEST DATA
DELETE FROM leads WHERE first_name = 'TEST' AND last_name = 'DELETE_ME';

-- 11. UPDATE RLS POLICIES — rename staff references to organiser
-- Update any RLS policies that reference 'staff' role
-- (Most policies use profile.role checks — update those)

-- 12. ADD show_phone TO PROFILES (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT true;

-- 13. ANNOUNCEMENT TARGET TYPES
-- Ensure announcements can target by badge_type including organiser and leadership
-- (The announcements system uses target_badge_types array — no schema change needed,
-- just ensure the UI sends the correct values)
