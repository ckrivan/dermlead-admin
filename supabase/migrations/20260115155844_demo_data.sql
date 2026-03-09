-- Converge Platform: Demo Data for Client Presentation
-- Run this AFTER sessions_schema.sql
-- Creates realistic dermatology conference data for the DID 2025 event

-- =============================================
-- 1. CREATE SPEAKERS TABLE (separate from auth profiles for demo)
-- =============================================
CREATE TABLE IF NOT EXISTS speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    credentials TEXT,
    bio TEXT,
    specialty TEXT,
    institution TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;

-- Everyone can view speakers
CREATE POLICY "Anyone can view speakers" ON speakers FOR SELECT USING (true);

-- =============================================
-- 2. UPDATE SESSION_SPEAKERS to reference speakers table
-- =============================================
-- Drop old foreign key if exists and add new one
ALTER TABLE session_speakers DROP CONSTRAINT IF EXISTS session_speakers_speaker_id_fkey;
ALTER TABLE session_speakers ADD CONSTRAINT session_speakers_speaker_id_fkey
    FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE;

-- =============================================
-- 3. CREATE DEMO EVENT (if not exists)
-- =============================================
INSERT INTO events (id, organization_id, name, location, start_date, end_date, slug, invite_code)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'DID 2025 - Diversity in Dermatology',
    'Atlanta, GA',
    '2025-04-10',
    '2025-04-12',
    'did-2025',
    'DID25'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date;

-- =============================================
-- 4. CREATE DEMO SPEAKERS
-- =============================================
INSERT INTO speakers (id, full_name, credentials, bio, specialty, institution)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Dr. Maya Johnson', 'MD, FAAD',
     'Dr. Maya Johnson is a board-certified dermatologist specializing in skin of color and health disparities.',
     'Skin of Color', 'Howard University Hospital'),

    ('11111111-1111-1111-1111-111111111102', 'Dr. Carlos Rivera', 'MD, PhD',
     'Dr. Rivera is a dermatologist-scientist focused on melanoma research in diverse populations.',
     'Dermatologic Oncology', 'MD Anderson Cancer Center'),

    ('11111111-1111-1111-1111-111111111103', 'Dr. Aisha Williams', 'MD, MPH',
     'Dr. Williams combines clinical dermatology with public health expertise.',
     'General Dermatology', 'Morehouse School of Medicine'),

    ('11111111-1111-1111-1111-111111111104', 'Dr. Kevin Park', 'MD, FAAD',
     'Dr. Park specializes in laser and cosmetic dermatology with expertise in treating Asian skin types.',
     'Cosmetic Dermatology', 'NYU Langone'),

    ('11111111-1111-1111-1111-111111111105', 'Dr. Fatima Hassan', 'MD',
     'Dr. Hassan focuses on pediatric dermatology and skin conditions affecting children of diverse backgrounds.',
     'Pediatric Dermatology', 'Children''s Hospital of Philadelphia'),

    ('11111111-1111-1111-1111-111111111106', 'Dr. Marcus Thompson', 'DO, FAOCD',
     'Dr. Thompson is an expert in hair disorders, with particular focus on traction alopecia.',
     'Hair Disorders', 'Cleveland Clinic'),

    ('11111111-1111-1111-1111-111111111107', 'Dr. Lisa Chen', 'MD, PhD',
     'Dr. Chen is a leading researcher in skin barrier function and eczema treatments.',
     'Atopic Dermatitis', 'Stanford Medicine'),

    ('11111111-1111-1111-1111-111111111108', 'Dr. James Okonkwo', 'MD, MBA',
     'Dr. Okonkwo combines medical expertise with business acumen.',
     'Practice Management', 'Private Practice')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    credentials = EXCLUDED.credentials,
    bio = EXCLUDED.bio,
    specialty = EXCLUDED.specialty,
    institution = EXCLUDED.institution;

-- =============================================
-- 5. CREATE DEMO SESSIONS
-- =============================================

-- DAY 1: April 10, 2025 (Thursday)
INSERT INTO sessions (id, event_id, title, description, objectives, session_type, session_date, start_time, end_time, location, track, is_highlighted)
VALUES
    ('22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-000000000002',
     'Registration & Breakfast', 'Pick up your badge and enjoy breakfast while networking.',
     ARRAY['Network with peers', 'Collect conference materials'],
     'meal', '2025-04-10', '07:00', '08:30', 'Grand Ballroom Foyer', NULL, false),

    ('22222222-2222-2222-2222-222222222202', '00000000-0000-0000-0000-000000000002',
     'Opening Keynote: The Future of Inclusive Dermatology',
     'An inspiring look at how our field is evolving to better serve all patients.',
     ARRAY['Understand current gaps in dermatologic care', 'Learn about emerging research', 'Identify improvement opportunities'],
     'keynote', '2025-04-10', '09:00', '10:30', 'Grand Ballroom A', 'Clinical', true),

    ('22222222-2222-2222-2222-222222222203', '00000000-0000-0000-0000-000000000002',
     'Coffee Break & Exhibition', 'Explore our exhibitor hall.',
     ARRAY[]::text[],
     'break', '2025-04-10', '10:30', '11:00', 'Exhibition Hall', NULL, false),

    ('22222222-2222-2222-2222-222222222204', '00000000-0000-0000-0000-000000000002',
     'Panel: Melanoma Detection in Diverse Skin Tones',
     'Expert panel discussing early melanoma detection across all skin types.',
     ARRAY['Recognize melanoma presentation differences', 'Apply dermoscopic techniques', 'Implement screening protocols'],
     'panel', '2025-04-10', '11:00', '12:30', 'Grand Ballroom A', 'Clinical', true),

    ('22222222-2222-2222-2222-222222222205', '00000000-0000-0000-0000-000000000002',
     'Lunch & Learn: New Biologics for Atopic Dermatitis',
     'Sponsored lunch session featuring the latest biologic treatments.',
     ARRAY['Review mechanism of action', 'Discuss patient selection criteria'],
     'meal', '2025-04-10', '12:30', '14:00', 'Grand Ballroom B', 'Clinical', false),

    ('22222222-2222-2222-2222-222222222206', '00000000-0000-0000-0000-000000000002',
     'Workshop: Laser Treatments for Diverse Skin Types',
     'Hands-on workshop covering safe and effective laser parameters.',
     ARRAY['Select appropriate laser settings', 'Recognize and prevent complications', 'Counsel patients'],
     'workshop', '2025-04-10', '14:00', '16:00', 'Workshop Room 1', 'Clinical', false),

    ('22222222-2222-2222-2222-222222222207', '00000000-0000-0000-0000-000000000002',
     'Workshop: Building a Culturally Competent Practice',
     'Learn strategies for creating an inclusive environment.',
     ARRAY['Assess current practice', 'Implement staff training', 'Develop inclusive marketing'],
     'workshop', '2025-04-10', '14:00', '16:00', 'Workshop Room 2', 'Business', false),

    ('22222222-2222-2222-2222-222222222208', '00000000-0000-0000-0000-000000000002',
     'Networking Reception', 'Join us for drinks and appetizers.',
     ARRAY[]::text[],
     'networking', '2025-04-10', '17:00', '19:00', 'Rooftop Terrace', NULL, false),

-- DAY 2: April 11, 2025 (Friday)
    ('22222222-2222-2222-2222-222222222209', '00000000-0000-0000-0000-000000000002',
     'Breakfast & Morning Yoga', 'Start your day with optional yoga.',
     ARRAY[]::text[],
     'meal', '2025-04-11', '07:00', '08:30', 'Garden Terrace', NULL, false),

    ('22222222-2222-2222-2222-222222222210', '00000000-0000-0000-0000-000000000002',
     'Keynote: Addressing Health Disparities Through Research',
     'Dr. Rivera presents groundbreaking research on improving outcomes.',
     ARRAY['Understand barriers to clinical trial participation', 'Design inclusive research protocols'],
     'keynote', '2025-04-11', '09:00', '10:30', 'Grand Ballroom A', 'Research', true),

    ('22222222-2222-2222-2222-222222222211', '00000000-0000-0000-0000-000000000002',
     'Breakout: Hair Loss in Women of Color',
     'Deep dive into CCCA, traction alopecia, and related conditions.',
     ARRAY['Diagnose CCCA early', 'Develop treatment plans', 'Counsel on preventive care'],
     'breakout', '2025-04-11', '11:00', '12:00', 'Breakout Room A', 'Clinical', false),

    ('22222222-2222-2222-2222-222222222212', '00000000-0000-0000-0000-000000000002',
     'Breakout: Pediatric Dermatology Across Cultures',
     'How cultural practices affect pediatric skin conditions.',
     ARRAY['Recognize culturally-influenced conditions', 'Communicate effectively', 'Adapt treatment recommendations'],
     'breakout', '2025-04-11', '11:00', '12:00', 'Breakout Room B', 'Clinical', false),

    ('22222222-2222-2222-2222-222222222213', '00000000-0000-0000-0000-000000000002',
     'Lunch & Poster Session', 'Browse research posters while enjoying lunch.',
     ARRAY[]::text[],
     'meal', '2025-04-11', '12:00', '13:30', 'Exhibition Hall', 'Research', false),

    ('22222222-2222-2222-2222-222222222214', '00000000-0000-0000-0000-000000000002',
     'Panel: The Business of Diversity',
     'Practice management experts share strategies for building inclusive practices.',
     ARRAY['Recruit and retain diverse staff', 'Market to underserved communities'],
     'panel', '2025-04-11', '14:00', '15:30', 'Grand Ballroom A', 'Business', false),

    ('22222222-2222-2222-2222-222222222215', '00000000-0000-0000-0000-000000000002',
     'Exhibition Hall Open', 'Last chance to visit exhibitors.',
     ARRAY[]::text[],
     'exhibition', '2025-04-11', '15:30', '17:00', 'Exhibition Hall', NULL, false),

    ('22222222-2222-2222-2222-222222222216', '00000000-0000-0000-0000-000000000002',
     'Gala Dinner & Awards', 'Celebrate excellence with dinner and awards.',
     ARRAY[]::text[],
     'networking', '2025-04-11', '19:00', '22:00', 'Grand Ballroom', NULL, true),

-- DAY 3: April 12, 2025 (Saturday)
    ('22222222-2222-2222-2222-222222222217', '00000000-0000-0000-0000-000000000002',
     'Breakfast', 'Final day breakfast.',
     ARRAY[]::text[],
     'meal', '2025-04-12', '07:30', '08:30', 'Grand Ballroom Foyer', NULL, false),

    ('22222222-2222-2222-2222-222222222218', '00000000-0000-0000-0000-000000000002',
     'Workshop: AI and Machine Learning in Diverse Dermatology',
     'Ensuring AI diagnostic tools work across all skin types.',
     ARRAY['Understand bias in AI tools', 'Evaluate AI for diverse populations', 'Advocate for inclusive AI'],
     'workshop', '2025-04-12', '09:00', '11:00', 'Workshop Room 1', 'Research', false),

    ('22222222-2222-2222-2222-222222222219', '00000000-0000-0000-0000-000000000002',
     'Workshop: Social Media for Skin of Color Education',
     'Leverage social media to educate patients.',
     ARRAY['Create educational content', 'Navigate algorithms', 'Measure engagement'],
     'workshop', '2025-04-12', '09:00', '11:00', 'Workshop Room 2', 'Business', false),

    ('22222222-2222-2222-2222-222222222220', '00000000-0000-0000-0000-000000000002',
     'Closing Keynote: Our Collective Path Forward',
     'Dr. Williams inspires us with a vision for the future.',
     ARRAY['Commit to diversity initiatives', 'Connect with community efforts', 'Plan for implementation'],
     'keynote', '2025-04-12', '11:30', '12:30', 'Grand Ballroom A', 'Clinical', true),

    ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000002',
     'Farewell Lunch & Networking', 'Final opportunity to connect.',
     ARRAY[]::text[],
     'meal', '2025-04-12', '12:30', '14:00', 'Grand Ballroom B', NULL, false)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    objectives = EXCLUDED.objectives,
    session_type = EXCLUDED.session_type,
    session_date = EXCLUDED.session_date,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    location = EXCLUDED.location,
    track = EXCLUDED.track,
    is_highlighted = EXCLUDED.is_highlighted;

-- =============================================
-- 6. ASSIGN SPEAKERS TO SESSIONS
-- =============================================
INSERT INTO session_speakers (session_id, speaker_id, role, display_order)
VALUES
    -- Opening Keynote - Dr. Johnson
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'speaker', 0),

    -- Melanoma Panel - Multiple speakers
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'moderator', 0),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'panelist', 1),
    ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111104', 'panelist', 2),

    -- Laser Workshop - Dr. Park
    ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111104', 'speaker', 0),

    -- Cultural Competency Workshop - Dr. Okonkwo
    ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111108', 'speaker', 0),

    -- Day 2 Keynote - Dr. Rivera
    ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111102', 'speaker', 0),

    -- Hair Loss Breakout - Dr. Thompson
    ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111106', 'speaker', 0),

    -- Pediatric Breakout - Dr. Hassan
    ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111105', 'speaker', 0),

    -- Business Panel - Multiple speakers
    ('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111108', 'moderator', 0),
    ('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111103', 'panelist', 1),

    -- AI Workshop - Dr. Chen
    ('22222222-2222-2222-2222-222222222218', '11111111-1111-1111-1111-111111111107', 'speaker', 0),

    -- Closing Keynote - Dr. Williams
    ('22222222-2222-2222-2222-222222222220', '11111111-1111-1111-1111-111111111103', 'speaker', 0)
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. CREATE SOME DEMO ATTENDEES
-- =============================================
INSERT INTO attendees (id, organization_id, event_id, first_name, last_name, email, phone, specialty, institution, title, badge_type, qr_data, checked_in)
VALUES
    ('33333333-3333-3333-3333-333333333301', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
     'Dr. Sarah', 'Mitchell', 'smitchell@dermgroup.com', '404-555-0101',
     'General Dermatology', 'Atlanta Dermatology Group', 'Associate Dermatologist', 'attendee',
     '{"firstName": "Sarah", "lastName": "Mitchell", "email": "smitchell@dermgroup.com"}'::jsonb, false),

    ('33333333-3333-3333-3333-333333333302', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
     'Dr. Anthony', 'Brooks', 'abrooks@skincenter.org', '404-555-0102',
     'Cosmetic Dermatology', 'Georgia Skin Center', 'Medical Director', 'attendee',
     '{"firstName": "Anthony", "lastName": "Brooks", "email": "abrooks@skincenter.org"}'::jsonb, false),

    ('33333333-3333-3333-3333-333333333303', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
     'Emily', 'Rodriguez', 'erodriguez@pharma.com', '404-555-0103',
     'Medical Affairs', 'PharmaCorp', 'Regional Medical Liaison', 'exhibitor',
     '{"firstName": "Emily", "lastName": "Rodriguez", "email": "erodriguez@pharma.com"}'::jsonb, false),

    ('33333333-3333-3333-3333-333333333304', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
     'David', 'Kim', 'dkim@medsolutions.com', '404-555-0104',
     'Sales', 'MedSolutions Inc', 'Territory Manager', 'exhibitor',
     '{"firstName": "David", "lastName": "Kim", "email": "dkim@medsolutions.com"}'::jsonb, false),

    ('33333333-3333-3333-3333-333333333305', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
     'Dr. Jennifer', 'Okafor', 'jokafor@emory.edu', '404-555-0105',
     'Dermatopathology', 'Emory University', 'Assistant Professor', 'speaker',
     '{"firstName": "Jennifer", "lastName": "Okafor", "email": "jokafor@emory.edu"}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- DONE
-- =============================================
SELECT 'Demo data loaded successfully!' as status;
SELECT COUNT(*) as session_count FROM sessions WHERE event_id = '00000000-0000-0000-0000-000000000002';
SELECT COUNT(*) as speaker_count FROM speakers;
SELECT COUNT(*) as attendee_count FROM attendees WHERE event_id = '00000000-0000-0000-0000-000000000002';
