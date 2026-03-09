-- Schema additions + Demo data for: speakers (update), exhibitors, sponsors, groups
-- For DID 2025 client presentation

-- =============================================
-- 1. UPDATE SPEAKERS TABLE (add missing columns)
-- =============================================
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set event_id for existing speakers
UPDATE speakers SET event_id = '00000000-0000-0000-0000-000000000002' WHERE event_id IS NULL;

-- Add dev RLS policy for speakers
DROP POLICY IF EXISTS "Allow public write access to speakers" ON speakers;
CREATE POLICY "Allow public write access to speakers"
ON speakers FOR ALL USING (true) WITH CHECK (true);

-- Update existing speakers with email
UPDATE speakers SET email = 'mjohnson@howard.edu' WHERE id = '11111111-1111-1111-1111-111111111101';
UPDATE speakers SET email = 'crivera@mdanderson.org' WHERE id = '11111111-1111-1111-1111-111111111102';
UPDATE speakers SET email = 'awilliams@morehouse.edu' WHERE id = '11111111-1111-1111-1111-111111111103';
UPDATE speakers SET email = 'kpark@nyulangone.org' WHERE id = '11111111-1111-1111-1111-111111111104';
UPDATE speakers SET email = 'fhassan@chop.edu' WHERE id = '11111111-1111-1111-1111-111111111105';
UPDATE speakers SET email = 'mthompson@clevelandclinic.org' WHERE id = '11111111-1111-1111-1111-111111111106';
UPDATE speakers SET email = 'lchen@stanfordmed.edu' WHERE id = '11111111-1111-1111-1111-111111111107';
UPDATE speakers SET email = 'jokonkwo@privatepractice.com' WHERE id = '11111111-1111-1111-1111-111111111108';

-- =============================================
-- 2. CREATE EXHIBITORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exhibitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    description TEXT,
    booth_number TEXT,
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    category TEXT,
    products_services TEXT[],
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exhibitors_event ON exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_category ON exhibitors(category);

ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public write access to exhibitors" ON exhibitors;

CREATE POLICY "Allow public read access to exhibitors"
ON exhibitors FOR SELECT USING (true);

CREATE POLICY "Allow public write access to exhibitors"
ON exhibitors FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. CREATE SPONSORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    description TEXT,
    tier TEXT NOT NULL DEFAULT 'partner' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'partner')),
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    contact_name TEXT,
    contact_email TEXT,
    booth_number TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_event ON sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tier);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow public write access to sponsors" ON sponsors;

CREATE POLICY "Allow public read access to sponsors"
ON sponsors FOR SELECT USING (true);

CREATE POLICY "Allow public write access to sponsors"
ON sponsors FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. INSERT DEMO EXHIBITORS (10)
-- =============================================
INSERT INTO exhibitors (id, event_id, company_name, description, booth_number, website_url, contact_name, contact_email, contact_phone, category, products_services) VALUES

('44444444-4444-4444-4444-444444444401', '00000000-0000-0000-0000-000000000002',
 'PharmaCorp Dermatology', 'Leading manufacturer of prescription topical treatments for inflammatory skin conditions.',
 'A-101', 'https://pharmacorp.example.com', 'Emily Rodriguez', 'erodriguez@pharmacorp.com', '404-555-2001',
 'Pharmaceuticals', ARRAY['Topical Corticosteroids', 'Retinoid Formulations', 'Anti-Inflammatory Creams']),

('44444444-4444-4444-4444-444444444402', '00000000-0000-0000-0000-000000000002',
 'LaserTech Systems', 'Advanced laser and light-based devices for dermatologic procedures.',
 'A-102', 'https://lasertech.example.com', 'Sarah Bennett', 'sbennett@lasertech.com', '404-555-2003',
 'Medical Devices', ARRAY['Fractional CO2 Laser', 'IPL Systems', 'Q-Switched Nd:YAG']),

('44444444-4444-4444-4444-444444444403', '00000000-0000-0000-0000-000000000002',
 'MedSolutions Inc', 'Complete practice management and EHR solutions for dermatology.',
 'B-201', 'https://medsolutions.example.com', 'David Kim', 'dkim@medsolutions.com', '404-555-2002',
 'Software', ARRAY['Dermatology EHR', 'Practice Analytics', 'Patient Portal']),

('44444444-4444-4444-4444-444444444404', '00000000-0000-0000-0000-000000000002',
 'SkinRx Pharmaceuticals', 'Innovative biologic therapies for moderate-to-severe skin conditions.',
 'A-103', 'https://skinrx.example.com', 'Jason Park', 'jpark@skinrx.com', '404-555-2004',
 'Pharmaceuticals', ARRAY['IL-17 Inhibitors', 'JAK Inhibitors', 'Biologic Therapies']),

('44444444-4444-4444-4444-444444444405', '00000000-0000-0000-0000-000000000002',
 'DermDevices Co', 'Clinical-grade skincare devices and consumables for in-office procedures.',
 'B-202', 'https://dermdevices.example.com', 'Michelle Foster', 'mfoster@dermdevices.com', '404-555-2005',
 'Medical Devices', ARRAY['Microneedling Pens', 'Dermabrasion Systems', 'LED Therapy Panels']),

('44444444-4444-4444-4444-444444444406', '00000000-0000-0000-0000-000000000002',
 'BioBeauty Labs', 'Medical-grade skincare products formulated for all skin types.',
 'C-301', 'https://biobeauty.example.com', 'Alex Rivera', 'arivera@biobeauty.com', '404-555-2006',
 'Healthcare Services', ARRAY['SPF Formulations', 'Hyperpigmentation Treatments', 'Barrier Repair Creams']),

('44444444-4444-4444-4444-444444444407', '00000000-0000-0000-0000-000000000002',
 'MedicalAI Corp', 'AI-powered diagnostic tools for dermatologic image analysis.',
 'B-203', 'https://medicalai.example.com', 'Rachel Huang', 'rhuang@medicalai.com', '404-555-2007',
 'Technology', ARRAY['Lesion Detection AI', 'Dermoscopy Analysis', 'Skin Type Classification']),

('44444444-4444-4444-4444-444444444408', '00000000-0000-0000-0000-000000000002',
 'Advanced Wound Care', 'Specialized wound care products for post-procedural healing.',
 'C-302', 'https://advancedwoundcare.example.com', 'Tom Jackson', 'tjackson@woundcare.com', '404-555-2008',
 'Healthcare Services', ARRAY['Surgical Dressings', 'Scar Management', 'Post-Laser Healing Kits']),

('44444444-4444-4444-4444-444444444409', '00000000-0000-0000-0000-000000000002',
 'DermPath Diagnostics', 'Digital pathology solutions and dermatopathology consulting.',
 'A-104', 'https://dermpath.example.com', 'Linda Chang', 'lchang@dermpath.com', '404-555-2009',
 'Research', ARRAY['Digital Slide Scanning', 'AI Pathology', 'Teleconsultation']),

('44444444-4444-4444-4444-444444444410', '00000000-0000-0000-0000-000000000002',
 'Inclusive Skin Academy', 'Continuing medical education and training programs for diverse dermatology.',
 'C-303', 'https://inclusiveskin.example.com', 'Dr. Nadia Brooks', 'nbrooks@inclusiveskin.com', '404-555-2010',
 'Education', ARRAY['CME Courses', 'Skin of Color Atlas', 'Workshop Materials'])

ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    booth_number = EXCLUDED.booth_number,
    category = EXCLUDED.category;

-- =============================================
-- 5. INSERT DEMO SPONSORS (7)
-- =============================================
INSERT INTO sponsors (id, event_id, company_name, description, tier, website_url, contact_name, contact_email, booth_number, display_order, is_featured) VALUES

-- Platinum Sponsors
('55555555-5555-5555-5555-555555555501', '00000000-0000-0000-0000-000000000002',
 'AbbVie', 'Global biopharmaceutical company committed to advancing dermatologic innovation and improving patient outcomes worldwide.',
 'platinum', 'https://abbvie.com', 'Victoria Adams', 'vadams@abbvie.com', 'P-1', 1, true),

('55555555-5555-5555-5555-555555555502', '00000000-0000-0000-0000-000000000002',
 'Galderma', 'World leader in dermatology with a portfolio spanning aesthetics, prescription, and consumer care.',
 'platinum', 'https://galderma.com', 'Mark Stevens', 'mstevens@galderma.com', 'P-2', 2, true),

-- Gold Sponsors
('55555555-5555-5555-5555-555555555503', '00000000-0000-0000-0000-000000000002',
 'Bristol-Myers Squibb', 'Leading pharmaceutical company with a growing portfolio of immuno-dermatology treatments.',
 'gold', 'https://bms.com', 'Sarah Chen', 'schen@bms.com', 'G-1', 3, true),

('55555555-5555-5555-5555-555555555504', '00000000-0000-0000-0000-000000000002',
 'Regeneron', 'Innovative science-driven company pioneering targeted biologic therapies for skin diseases.',
 'gold', 'https://regeneron.com', 'Michael Torres', 'mtorres@regeneron.com', 'G-2', 4, true),

-- Silver Sponsors
('55555555-5555-5555-5555-555555555505', '00000000-0000-0000-0000-000000000002',
 'Sun Pharma', 'Global specialty pharmaceutical company with a strong dermatology focus.',
 'silver', 'https://sunpharma.com', 'Raj Patel', 'rpatel@sunpharma.com', NULL, 5, false),

-- Bronze Sponsors
('55555555-5555-5555-5555-555555555506', '00000000-0000-0000-0000-000000000002',
 'Incyte Corporation', 'Biopharmaceutical company focused on JAK inhibitor therapies for inflammatory skin conditions.',
 'bronze', 'https://incyte.com', 'Jennifer Walsh', 'jwalsh@incyte.com', NULL, 6, false),

-- Partners
('55555555-5555-5555-5555-555555555507', '00000000-0000-0000-0000-000000000002',
 'Skin of Color Society', 'Professional organization dedicated to promoting awareness and excellence in skin of color dermatology.',
 'partner', 'https://skinofcolorsociety.org', 'Dr. Keisha Williams', 'kwilliams@socs.org', NULL, 7, false)

ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    display_order = EXCLUDED.display_order;

-- =============================================
-- 6. INSERT DEMO GROUPS (5 default groups)
-- =============================================
INSERT INTO event_groups (id, event_id, name, description, color) VALUES
('66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000002',
 'Admin', 'Event administrators and organizers', '#ef4444'),
('66666666-6666-6666-6666-666666666602', '00000000-0000-0000-0000-000000000002',
 'Attendee', 'General event attendees', '#3b82f6'),
('66666666-6666-6666-6666-666666666603', '00000000-0000-0000-0000-000000000002',
 'Sponsor', 'Event sponsors and exhibitors', '#f59e0b'),
('66666666-6666-6666-6666-666666666604', '00000000-0000-0000-0000-000000000002',
 'Speaker', 'Speakers and presenters', '#8b5cf6'),
('66666666-6666-6666-6666-666666666605', '00000000-0000-0000-0000-000000000002',
 'VIP', 'VIP guests and special invitees', '#10b981')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color;

-- =============================================
-- 7. ASSIGN GROUP MEMBERS
-- =============================================

-- Add speakers to Speaker group
INSERT INTO group_members (group_id, entity_type, entity_id) VALUES
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111101'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111102'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111103'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111104'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111105'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111106'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111107'),
('66666666-6666-6666-6666-666666666604', 'speaker', '11111111-1111-1111-1111-111111111108')
ON CONFLICT (group_id, entity_type, entity_id) DO NOTHING;

-- Add exhibitors to Sponsor group (exhibitors are typically grouped with sponsors)
INSERT INTO group_members (group_id, entity_type, entity_id) VALUES
('66666666-6666-6666-6666-666666666603', 'exhibitor', '44444444-4444-4444-4444-444444444401'),
('66666666-6666-6666-6666-666666666603', 'exhibitor', '44444444-4444-4444-4444-444444444402'),
('66666666-6666-6666-6666-666666666603', 'exhibitor', '44444444-4444-4444-4444-444444444403'),
('66666666-6666-6666-6666-666666666603', 'exhibitor', '44444444-4444-4444-4444-444444444404'),
('66666666-6666-6666-6666-666666666603', 'exhibitor', '44444444-4444-4444-4444-444444444405')
ON CONFLICT (group_id, entity_type, entity_id) DO NOTHING;

-- Add sponsors to Sponsor group
INSERT INTO group_members (group_id, entity_type, entity_id) VALUES
('66666666-6666-6666-6666-666666666603', 'sponsor', '55555555-5555-5555-5555-555555555501'),
('66666666-6666-6666-6666-666666666603', 'sponsor', '55555555-5555-5555-5555-555555555502'),
('66666666-6666-6666-6666-666666666603', 'sponsor', '55555555-5555-5555-5555-555555555503'),
('66666666-6666-6666-6666-666666666603', 'sponsor', '55555555-5555-5555-5555-555555555504')
ON CONFLICT (group_id, entity_type, entity_id) DO NOTHING;

-- Add a few VIPs (platinum sponsor contacts + keynote speakers)
INSERT INTO group_members (group_id, entity_type, entity_id) VALUES
('66666666-6666-6666-6666-666666666605', 'sponsor', '55555555-5555-5555-5555-555555555501'),
('66666666-6666-6666-6666-666666666605', 'sponsor', '55555555-5555-5555-5555-555555555502'),
('66666666-6666-6666-6666-666666666605', 'speaker', '11111111-1111-1111-1111-111111111101'),
('66666666-6666-6666-6666-666666666605', 'speaker', '11111111-1111-1111-1111-111111111103')
ON CONFLICT (group_id, entity_type, entity_id) DO NOTHING;

-- =============================================
-- SUMMARY
-- =============================================
SELECT 'Exhibitors, sponsors, groups demo data loaded!' as status;
SELECT COUNT(*) as exhibitor_count FROM exhibitors WHERE event_id = '00000000-0000-0000-0000-000000000002';
SELECT COUNT(*) as sponsor_count FROM sponsors WHERE event_id = '00000000-0000-0000-0000-000000000002';
SELECT COUNT(*) as group_count FROM event_groups WHERE event_id = '00000000-0000-0000-0000-000000000002';
SELECT COUNT(*) as group_member_count FROM group_members;
