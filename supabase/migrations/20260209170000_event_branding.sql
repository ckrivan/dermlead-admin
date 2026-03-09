-- Event Branding, Photos, FAQ + Attendee Role
-- Adds branding columns to events, creates event_photos and event_faq tables,
-- and adds 'attendee' as a valid profile role.

-- =============================================
-- 1. BRANDING COLUMNS ON EVENTS
-- =============================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1E88E5';
ALTER TABLE events ADD COLUMN IF NOT EXISTS website_url TEXT;

-- =============================================
-- 2. EVENT PHOTOS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id),
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_created ON event_photos(created_at DESC);

ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_photos_select" ON event_photos FOR SELECT USING (true);

-- Anyone authenticated can upload photos
CREATE POLICY "event_photos_insert" ON event_photos FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

CREATE POLICY "event_photos_update" ON event_photos FOR UPDATE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "event_photos_delete" ON event_photos FOR DELETE
    USING (
        uploaded_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 3. EVENT FAQ TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_faq_event ON event_faq(event_id);

ALTER TABLE event_faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_faq_select" ON event_faq FOR SELECT USING (true);

CREATE POLICY "event_faq_insert" ON event_faq FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "event_faq_update" ON event_faq FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "event_faq_delete" ON event_faq FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- 4. ADD ATTENDEE ROLE
-- =============================================
-- Normalize existing roles before adding constraint
UPDATE profiles SET role = 'attendee' WHERE role IS NULL OR role NOT IN ('admin', 'rep', 'attendee');

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'rep', 'attendee'));

-- =============================================
-- 5. SEED DEMO BRANDING DATA
-- =============================================
UPDATE events SET
    description = 'The premier dermatology conference featuring cutting-edge research, hands-on workshops, and networking opportunities with industry leaders.',
    banner_url = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
WHERE name LIKE '%DID%' OR id = (SELECT id FROM events ORDER BY created_at DESC LIMIT 1);

-- Seed FAQ for the most recent event
INSERT INTO event_faq (event_id, question, answer, sort_order)
SELECT e.id, q.question, q.answer, q.sort_order
FROM (SELECT id FROM events ORDER BY created_at DESC LIMIT 1) e
CROSS JOIN (VALUES
    ('What is the Wi-Fi password?', 'Network: DID2026-Guest / Password: Welcome2026!', 1),
    ('Where do I park?', 'Complimentary valet parking is available at the main entrance. Self-park in Garage B, Level 2-4.', 2),
    ('What are the event hours?', 'Registration opens at 7:00 AM. Sessions run 8:00 AM - 5:00 PM. Evening reception 6:00 - 8:00 PM.', 3),
    ('Is there a dress code?', 'Business casual for daytime sessions. Smart casual for the evening reception.', 4),
    ('How do I get CME credits?', 'Scan your badge at each session you attend. Credits are automatically tracked and emailed post-event.', 5)
) AS q(question, answer, sort_order);

SELECT 'Event branding, photos, FAQ tables created. Attendee role added.' as status;
