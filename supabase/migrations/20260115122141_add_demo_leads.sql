-- Add demo leads for ckrivan@gmail.com
INSERT INTO leads (organization_id, event_id, captured_by, first_name, last_name, work_email, specialty)
SELECT
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',  -- DID 2026 event
    p.id,
    t.first_name,
    t.last_name,
    t.email,
    t.specialty
FROM profiles p
CROSS JOIN (VALUES
    ('John', 'Smith', 'john.smith@dermclinic.com', 'Cosmetic Dermatology'),
    ('Sarah', 'Johnson', 'sjohnson@skincare.org', 'Medical Dermatology'),
    ('Michael', 'Chen', 'mchen@university.edu', 'Dermatologic Surgery'),
    ('Emily', 'Davis', 'edavis@practice.com', 'Pediatric Dermatology'),
    ('Robert', 'Wilson', 'rwilson@hospital.org', 'Mohs Surgery')
) AS t(first_name, last_name, email, specialty)
WHERE p.email = 'ckrivan@gmail.com'
ON CONFLICT DO NOTHING;

SELECT 'Demo leads added!' as status;
