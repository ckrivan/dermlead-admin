-- Update event and session dates from 2025 to 2026

-- Update the DID event dates
UPDATE events
SET
    name = 'DID 2026 - Diversity in Dermatology',
    start_date = '2026-04-10',
    end_date = '2026-04-12',
    slug = 'did-2026'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Update all session dates from April 2025 to April 2026
UPDATE sessions
SET session_date = session_date + INTERVAL '1 year'
WHERE event_id = '00000000-0000-0000-0000-000000000002'
  AND session_date >= '2025-01-01'
  AND session_date < '2026-01-01';

SELECT 'Dates updated to 2026!' as status;
