-- Fix SECURITY DEFINER views flagged by Supabase linter
-- These views were running as the view owner (postgres), bypassing RLS.
-- Recreate with security_invoker = true so they respect the querying user's RLS policies.

-- 1. sessions_with_speakers
CREATE OR REPLACE VIEW sessions_with_speakers
WITH (security_invoker = true)
AS
SELECT
    s.*,
    COUNT(ss.id) as speaker_count,
    ARRAY_AGG(p.full_name ORDER BY ss.display_order) FILTER (WHERE p.full_name IS NOT NULL) as speaker_names
FROM sessions s
LEFT JOIN session_speakers ss ON ss.session_id = s.id
LEFT JOIN profiles p ON p.id = ss.speaker_id
GROUP BY s.id;

-- 2. user_agenda_details
CREATE OR REPLACE VIEW user_agenda_details
WITH (security_invoker = true)
AS
SELECT
    ua.user_id,
    ua.registered,
    s.*
FROM user_agenda ua
JOIN sessions s ON s.id = ua.session_id;

-- 3. event_checkin_stats
CREATE OR REPLACE VIEW event_checkin_stats
WITH (security_invoker = true)
AS
SELECT
    e.id as event_id,
    e.name as event_name,
    e.slug,
    e.invite_code,
    COUNT(DISTINCT er.id) as total_registered,
    COUNT(DISTINCT er.id) FILTER (WHERE er.checked_in = TRUE) as checked_in_count,
    COUNT(DISTINCT a.id) as total_attendees,
    COUNT(DISTINCT a.id) FILTER (WHERE a.checked_in = TRUE) as attendees_checked_in
FROM events e
LEFT JOIN event_registrations er ON er.event_id = e.id
LEFT JOIN attendees a ON a.event_id = e.id
GROUP BY e.id, e.name, e.slug, e.invite_code;
