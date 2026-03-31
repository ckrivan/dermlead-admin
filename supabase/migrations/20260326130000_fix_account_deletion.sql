-- Fix account deletion: delete_my_account should DELETE attendee records, not just unlink them.
-- Also adds a helper for admins to delete auth users by email.

-- 1. Fix delete_my_account: properly delete attendee records instead of just unlinking
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email
    FROM auth.users WHERE id = v_user_id;

  -- Clean up user-generated content
  DELETE FROM leads WHERE captured_by = v_user_id;
  DELETE FROM messages WHERE sender_id = v_user_id;
  DELETE FROM conversations WHERE participant_1 = v_user_id OR participant_2 = v_user_id;
  DELETE FROM post_comments WHERE author_id = v_user_id;
  DELETE FROM community_posts WHERE author_id = v_user_id;
  DELETE FROM post_likes WHERE user_id = v_user_id;
  DELETE FROM content_reports WHERE reporter_id = v_user_id;
  DELETE FROM user_agenda WHERE user_id = v_user_id;
  DELETE FROM event_registrations WHERE user_id = v_user_id;

  -- Clean up attendee records (DELETE, not just unlink)
  -- First remove group memberships for all attendee records
  DELETE FROM group_members WHERE entity_type = 'attendee' AND entity_id IN (
    SELECT id FROM attendees WHERE profile_id = v_user_id
  );
  -- Remove linked speaker records
  DELETE FROM speakers WHERE attendee_id IN (
    SELECT id FROM attendees WHERE profile_id = v_user_id
  );
  -- Delete the attendee records themselves
  DELETE FROM attendees WHERE profile_id = v_user_id;

  -- Also clean up any attendees checked in by this user
  UPDATE attendees SET checked_in_by = NULL WHERE checked_in_by = v_user_id;

  -- Delete profile and auth user
  DELETE FROM profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- 2. Admin helper: delete an auth user by email (for cleaning up ghost accounts)
-- Only callable by service_role, not by regular users
CREATE OR REPLACE FUNCTION admin_delete_user_by_email(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = target_email;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_email;
  END IF;

  -- Clean up all related records
  DELETE FROM leads WHERE captured_by = v_user_id;
  DELETE FROM messages WHERE sender_id = v_user_id;
  DELETE FROM conversations WHERE participant_1 = v_user_id OR participant_2 = v_user_id;
  DELETE FROM post_comments WHERE author_id = v_user_id;
  DELETE FROM community_posts WHERE author_id = v_user_id;
  DELETE FROM post_likes WHERE user_id = v_user_id;
  DELETE FROM content_reports WHERE reporter_id = v_user_id;
  DELETE FROM user_agenda WHERE user_id = v_user_id;
  DELETE FROM event_registrations WHERE user_id = v_user_id;

  DELETE FROM group_members WHERE entity_type = 'attendee' AND entity_id IN (
    SELECT id FROM attendees WHERE profile_id = v_user_id
  );
  DELETE FROM speakers WHERE attendee_id IN (
    SELECT id FROM attendees WHERE profile_id = v_user_id
  );
  DELETE FROM attendees WHERE profile_id = v_user_id;
  UPDATE attendees SET checked_in_by = NULL WHERE checked_in_by = v_user_id;

  DELETE FROM profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
