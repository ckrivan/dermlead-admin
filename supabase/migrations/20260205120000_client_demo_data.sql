-- Client Demo Data: Realistic admin dashboard content
-- Adds 25 leads with varied scores/dates and 30 attendees

-- =============================================
-- 0. CREATE DEMO REP PROFILES (for captured_by foreign key)
-- =============================================
-- These are demo profiles for sales reps who "captured" leads
INSERT INTO auth.users (id, email, role, instance_id, aud, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000099', 'demo.rep1@dermlead.com', 'authenticated',
   '00000000-0000-0000-0000-000000000000', 'authenticated', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000098', 'demo.rep2@dermlead.com', 'authenticated',
   '00000000-0000-0000-0000-000000000000', 'authenticated', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, email, role, organization_id)
VALUES
  ('00000000-0000-0000-0000-000000000099', 'Sarah Chen', 'demo.rep1@dermlead.com', 'rep', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000098', 'Marcus Williams', 'demo.rep2@dermlead.com', 'rep', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- =============================================
-- 1. ADD DEMO LEADS (25 total with varied scores and dates)
-- =============================================

-- Delete old demo leads first to avoid duplicates
DELETE FROM leads WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND event_id = '00000000-0000-0000-0000-000000000002';

INSERT INTO leads (
  organization_id, event_id, captured_by,
  first_name, last_name, work_email, personal_email, phone,
  specialty, institution, years_in_practice,
  interest_areas, notes, lead_score, created_at, updated_at
) VALUES
-- Very Hot leads (score 5) - captured today and yesterday
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Amanda', 'Sterling', 'asterling@mayoclinic.org', 'amanda.sterling@gmail.com', '507-555-0101',
 'Cosmetic Dermatology', 'Mayo Clinic', '15+',
 '["Laser Therapy", "Injectable Fillers", "Skin Rejuvenation"]', 'Very interested in our new laser platform. Wants a follow-up demo at her clinic.', 5,
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Marcus', 'Webb', 'mwebb@clevelandclinic.org', NULL, '216-555-0102',
 'Dermatologic Surgery', 'Cleveland Clinic', '10-15',
 '["Mohs Surgery", "Wound Care", "Skin Cancer"]', 'Runs a high-volume Mohs surgery center. Ready to trial our products.', 5,
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Priya', 'Patel', 'ppatel@stanfordmed.edu', 'priya.patel@icloud.com', '650-555-0103',
 'Medical Dermatology', 'Stanford Medicine', '5-10',
 '["Biologics", "Psoriasis", "Atopic Dermatitis"]', 'Leading a clinical trial. Needs 500 units by Q3. High priority.', 5,
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. James', 'Nakamura', 'jnakamura@ucsf.edu', NULL, '415-555-0104',
 'Skin of Color', 'UCSF Dermatology', '10-15',
 '["Hyperpigmentation", "Laser Safety", "Diverse Skin Types"]', 'Expanding his practice. Wants pricing for full product line.', 5,
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Hot leads (score 4) - captured 1-3 days ago
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Rachel', 'Hoffman', 'rhoffman@nyuderm.org', 'rachel.hoffman@yahoo.com', '212-555-0201',
 'Cosmetic Dermatology', 'NYU Langone', '5-10',
 '["Chemical Peels", "Microneedling", "PRP Therapy"]', 'Interested in our microneedling devices. Asked for clinical data.', 4,
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000098',
 'Dr. William', 'Osei', 'wosei@howardmed.edu', NULL, '202-555-0202',
 'General Dermatology', 'Howard University Hospital', '3-5',
 '["Acne", "Eczema", "Patient Education"]', 'New practice, building out product inventory. Good long-term prospect.', 4,
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000098',
 'Dr. Sofia', 'Ramirez', 'sramirez@utswmed.edu', 'sofia.ramirez@gmail.com', '214-555-0203',
 'Pediatric Dermatology', 'UT Southwestern', '5-10',
 '["Pediatric Eczema", "Birthmarks", "Gentle Formulations"]', 'Needs pediatric-safe formulations. Sent her our catalog.', 4,
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Kevin', 'Tran', 'ktran@massgeneral.org', NULL, '617-555-0204',
 'Dermatologic Surgery', 'Massachusetts General Hospital', '10-15',
 '["Electrosurgery", "Cryotherapy", "Wound Closure"]', 'Upgrading surgical suite. Requested quote for equipment bundle.', 4,
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Olivia', 'Chen', 'ochen@pennmedicine.org', 'olivia.chen.md@gmail.com', '215-555-0205',
 'Medical Dermatology', 'Penn Medicine', '3-5',
 '["Autoimmune Disorders", "Biologics", "Clinical Trials"]', 'Running a biologics comparison study. Wants to partner on data.', 4,
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Warm leads (score 3) - captured 2-5 days ago
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. David', 'Adeyemi', 'dadeyemi@emory.edu', NULL, '404-555-0301',
 'General Dermatology', 'Emory Healthcare', '5-10',
 '["Teledermatology", "AI Diagnostics", "Practice Management"]', 'Exploring telehealth options. Might be a good fit for our platform.', 3,
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Lauren', 'McCarthy', 'lmccarthy@dermassoc.com', 'lauren.mccarthy@outlook.com', '312-555-0302',
 'Cosmetic Dermatology', 'Chicago Dermatology Associates', '10-15',
 '["Body Contouring", "Skin Tightening"]', 'Came by booth briefly. Left card. Follow up next week.', 3,
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000098',
 'Dr. Hassan', 'Ali', 'hali@johnshopkins.edu', NULL, '410-555-0303',
 'Skin of Color', 'Johns Hopkins', '3-5',
 '["Keloids", "Vitiligo", "Cultural Competency"]', 'Research focused. May need products for upcoming study.', 3,
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Michelle', 'Torres', 'mtorres@uclahealth.org', 'michelle.torres@gmail.com', '310-555-0304',
 'Pediatric Dermatology', 'UCLA Health', '5-10',
 '["Infantile Hemangiomas", "Genetic Disorders"]', 'Met at poster session. Good conversation. Send research papers.', 3,
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000098',
 'Dr. Brian', 'Fitzgerald', 'bfitzgerald@vanderbilt.edu', NULL, '615-555-0305',
 'Medical Dermatology', 'Vanderbilt University Medical Center', '15+',
 '["Psoriasis", "Connective Tissue Disease"]', 'Well-established practice. Already uses competitor products.', 3,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Nina', 'Gupta', 'ngupta@northwestern.edu', 'nina.gupta.md@gmail.com', '312-555-0306',
 'General Dermatology', 'Northwestern Medicine', '3-5',
 '["Acne", "Rosacea", "Telemedicine"]', 'Early career. Building patient base. Moderate interest.', 3,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Cool leads (score 2) - captured 4-6 days ago
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000098',
 'Dr. Thomas', 'Lee', 'tlee@brighamandwomens.org', NULL, '617-555-0401',
 'Dermatopathology', 'Brigham and Women''s Hospital', '15+',
 '["Histopathology", "Molecular Diagnostics"]', 'Lab-focused. Limited product needs but good referral source.', 2,
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Angela', 'Washington', 'awashington@meharry.edu', 'angela.wash@gmail.com', '615-555-0402',
 'General Dermatology', 'Meharry Medical College', '5-10',
 '["Health Disparities", "Community Outreach"]', 'Academic focus. Interested in educational partnerships more than products.', 2,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Robert', 'Kim', 'rkim@seattlechildrens.org', NULL, '206-555-0403',
 'Pediatric Dermatology', 'Seattle Children''s Hospital', '10-15',
 '["Pediatric Psoriasis", "School-Age Skin Conditions"]', 'Stopped by booth. Collected brochure only.', 2,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Cold leads (score 1) - captured 5-7 days ago
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Steven', 'Park', 'spark@uic.edu', NULL, '312-555-0501',
 'General Dermatology', 'UIC College of Medicine', '1-3',
 '["Residency Training"]', 'Resident. No purchasing authority. Future contact.', 1,
 NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000098',
 'Janet', 'Collins', 'jcollins@pharmaresearch.com', 'janet.collins@hotmail.com', '919-555-0502',
 'Medical Affairs', 'PharmaResearch Inc', '5-10',
 '["Competitive Analysis"]', 'Competitor rep gathering info. Not a real prospect.', 1,
 NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Emily', 'Sato', 'esato@ucsd.edu', NULL, '858-555-0503',
 'Dermatologic Surgery', 'UC San Diego Health', '1-3',
 '["Fellowship Training"]', 'Fellow. Interested but no budget. Revisit in 2 years.', 1,
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

-- Additional leads for variety in the trend chart
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Catherine', 'Dubois', 'cdubois@tulane.edu', 'cat.dubois@gmail.com', '504-555-0601',
 'Medical Dermatology', 'Tulane Medical Center', '5-10',
 '["Tropical Dermatology", "Infectious Diseases"]', 'Niche specialty. Could be good reference account.', 4,
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099',
 'Dr. Anthony', 'Russo', 'arusso@mountsinai.org', NULL, '212-555-0602',
 'Cosmetic Dermatology', 'Mount Sinai Hospital', '10-15',
 '["Injectable Neurotoxins", "Dermal Fillers", "Combination Treatments"]', 'High-volume injector. Very interested in our new filler line.', 5,
 NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours');


-- =============================================
-- 2. ADD MORE DEMO ATTENDEES (30 total with existing 5)
-- =============================================

-- Delete existing demo attendees to repopulate cleanly
DELETE FROM attendees WHERE organization_id = '00000000-0000-0000-0000-000000000001'
  AND event_id = '00000000-0000-0000-0000-000000000002';

INSERT INTO attendees (
  organization_id, event_id, first_name, last_name, email, phone,
  specialty, institution, title, badge_type,
  qr_data, checked_in, checked_in_at
) VALUES
-- Attendees (15) - mix of checked in and not
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Sarah', 'Mitchell', 'smitchell@dermgroup.com', '404-555-1001',
 'General Dermatology', 'Atlanta Dermatology Group', 'Associate Dermatologist', 'attendee',
 '{"firstName": "Sarah", "lastName": "Mitchell"}'::jsonb, true, NOW() - INTERVAL '3 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Anthony', 'Brooks', 'abrooks@skincenter.org', '404-555-1002',
 'Cosmetic Dermatology', 'Georgia Skin Center', 'Medical Director', 'attendee',
 '{"firstName": "Anthony", "lastName": "Brooks"}'::jsonb, true, NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Lisa', 'Wong', 'lwong@dermpartners.com', '404-555-1003',
 'Medical Dermatology', 'Dermatology Partners', 'Senior Physician', 'attendee',
 '{"firstName": "Lisa", "lastName": "Wong"}'::jsonb, true, NOW() - INTERVAL '4 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Michael', 'Johnson', 'mjohnson@piedmont.org', '404-555-1004',
 'Dermatologic Surgery', 'Piedmont Healthcare', 'Surgeon', 'attendee',
 '{"firstName": "Michael", "lastName": "Johnson"}'::jsonb, true, NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Patricia', 'Davis', 'pdavis@grady.org', '404-555-1005',
 'General Dermatology', 'Grady Health System', 'Attending Physician', 'attendee',
 '{"firstName": "Patricia", "lastName": "Davis"}'::jsonb, true, NOW() - INTERVAL '3 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Ryan', 'Thomas', 'rthomas@emory.edu', '404-555-1006',
 'Pediatric Dermatology', 'Emory University', 'Assistant Professor', 'attendee',
 '{"firstName": "Ryan", "lastName": "Thomas"}'::jsonb, true, NOW() - INTERVAL '1 hour'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Karen', 'Williams', 'kwilliams@northside.com', '404-555-1007',
 'Cosmetic Dermatology', 'Northside Dermatology', 'Practice Owner', 'attendee',
 '{"firstName": "Karen", "lastName": "Williams"}'::jsonb, true, NOW() - INTERVAL '6 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Daniel', 'Garcia', 'dgarcia@wellstar.org', '404-555-1008',
 'Medical Dermatology', 'WellStar Health', 'Dermatologist', 'attendee',
 '{"firstName": "Daniel", "lastName": "Garcia"}'::jsonb, true, NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Jennifer', 'Martinez', 'jmartinez@augustahealth.org', '706-555-1009',
 'General Dermatology', 'Augusta University', 'Associate Professor', 'attendee',
 '{"firstName": "Jennifer", "lastName": "Martinez"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Christopher', 'Brown', 'cbrown@skinsouth.com', '404-555-1010',
 'Dermatologic Surgery', 'Skin South Dermatology', 'Partner', 'attendee',
 '{"firstName": "Christopher", "lastName": "Brown"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Amanda', 'Taylor', 'ataylor@morehouse.edu', '404-555-1011',
 'Skin of Color', 'Morehouse School of Medicine', 'Resident', 'attendee',
 '{"firstName": "Amanda", "lastName": "Taylor"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. James', 'Anderson', 'janderson@piedmontderm.com', '770-555-1012',
 'Medical Dermatology', 'Piedmont Dermatology', 'Physician', 'attendee',
 '{"firstName": "James", "lastName": "Anderson"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Maria', 'Gonzalez', 'mgonzalez@cdc.gov', '404-555-1013',
 'General Dermatology', 'CDC', 'Medical Officer', 'attendee',
 '{"firstName": "Maria", "lastName": "Gonzalez"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Robert', 'White', 'rwhite@choa.org', '404-555-1014',
 'Pediatric Dermatology', 'Children''s Healthcare of Atlanta', 'Staff Physician', 'attendee',
 '{"firstName": "Robert", "lastName": "White"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Susan', 'Clark', 'sclark@dekalbderm.com', '404-555-1015',
 'Cosmetic Dermatology', 'DeKalb Dermatology', 'Owner', 'attendee',
 '{"firstName": "Susan", "lastName": "Clark"}'::jsonb, false, NULL),

-- Exhibitors (8)
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Emily', 'Rodriguez', 'erodriguez@pharma.com', '404-555-2001',
 'Medical Affairs', 'PharmaCorp', 'Regional Medical Liaison', 'exhibitor',
 '{"firstName": "Emily", "lastName": "Rodriguez"}'::jsonb, true, NOW() - INTERVAL '7 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'David', 'Kim', 'dkim@medsolutions.com', '404-555-2002',
 'Sales', 'MedSolutions Inc', 'Territory Manager', 'exhibitor',
 '{"firstName": "David", "lastName": "Kim"}'::jsonb, true, NOW() - INTERVAL '7 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Sarah', 'Bennett', 'sbennett@lasertech.com', '404-555-2003',
 'Sales', 'LaserTech Systems', 'Account Executive', 'exhibitor',
 '{"firstName": "Sarah", "lastName": "Bennett"}'::jsonb, true, NOW() - INTERVAL '6 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Jason', 'Park', 'jpark@skinrx.com', '404-555-2004',
 'Marketing', 'SkinRx Pharmaceuticals', 'Marketing Director', 'exhibitor',
 '{"firstName": "Jason", "lastName": "Park"}'::jsonb, true, NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Michelle', 'Foster', 'mfoster@dermdevices.com', '404-555-2005',
 'Clinical', 'DermDevices Co', 'Clinical Specialist', 'exhibitor',
 '{"firstName": "Michelle", "lastName": "Foster"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Alex', 'Rivera', 'arivera@biobeauty.com', '404-555-2006',
 'Sales', 'BioBeauty Labs', 'Regional Manager', 'exhibitor',
 '{"firstName": "Alex", "lastName": "Rivera"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Rachel', 'Huang', 'rhuang@medicalai.com', '404-555-2007',
 'Technology', 'MedicalAI Corp', 'Product Manager', 'exhibitor',
 '{"firstName": "Rachel", "lastName": "Huang"}'::jsonb, false, NULL),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Tom', 'Jackson', 'tjackson@woundcare.com', '404-555-2008',
 'Sales', 'Advanced Wound Care', 'VP Sales', 'exhibitor',
 '{"firstName": "Tom", "lastName": "Jackson"}'::jsonb, false, NULL),

-- Speakers (5)
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Jennifer', 'Okafor', 'jokafor@emory.edu', '404-555-3001',
 'Dermatopathology', 'Emory University', 'Assistant Professor', 'speaker',
 '{"firstName": "Jennifer", "lastName": "Okafor"}'::jsonb, true, NOW() - INTERVAL '8 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Maya', 'Johnson', 'mjohnson@howard.edu', '202-555-3002',
 'Skin of Color', 'Howard University Hospital', 'Professor', 'speaker',
 '{"firstName": "Maya", "lastName": "Johnson"}'::jsonb, true, NOW() - INTERVAL '7 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Carlos', 'Rivera', 'crivera@mdanderson.org', '713-555-3003',
 'Dermatologic Oncology', 'MD Anderson Cancer Center', 'Associate Professor', 'speaker',
 '{"firstName": "Carlos", "lastName": "Rivera"}'::jsonb, true, NOW() - INTERVAL '6 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Kevin', 'Park', 'kpark@nyulangone.org', '212-555-3004',
 'Cosmetic Dermatology', 'NYU Langone', 'Clinical Associate Professor', 'speaker',
 '{"firstName": "Kevin", "lastName": "Park"}'::jsonb, true, NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Dr. Aisha', 'Williams', 'awilliams@morehouse.edu', '404-555-3005',
 'General Dermatology', 'Morehouse School of Medicine', 'Department Chair', 'speaker',
 '{"firstName": "Aisha", "lastName": "Williams"}'::jsonb, true, NOW() - INTERVAL '4 hours'),

-- Sponsors (2)
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Victoria', 'Adams', 'vadams@abbvie.com', '847-555-4001',
 'Corporate', 'AbbVie', 'Director of Partnerships', 'sponsor',
 '{"firstName": "Victoria", "lastName": "Adams"}'::jsonb, true, NOW() - INTERVAL '8 hours'),

('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
 'Mark', 'Stevens', 'mstevens@galderma.com', '817-555-4002',
 'Corporate', 'Galderma', 'VP Medical Affairs', 'sponsor',
 '{"firstName": "Mark", "lastName": "Stevens"}'::jsonb, true, NOW() - INTERVAL '7 hours');


-- =============================================
-- SUMMARY
-- =============================================
SELECT 'Client demo data loaded!' as status;
SELECT COUNT(*) as total_leads FROM leads WHERE event_id = '00000000-0000-0000-0000-000000000002';
SELECT COUNT(*) as total_attendees FROM attendees WHERE event_id = '00000000-0000-0000-0000-000000000002';
SELECT
  COUNT(*) FILTER (WHERE checked_in = true) as checked_in,
  COUNT(*) FILTER (WHERE checked_in = false) as not_checked_in
FROM attendees WHERE event_id = '00000000-0000-0000-0000-000000000002';
