-- Fix DID 2026 event dates: October (wrong) → April 16-19 (correct)
UPDATE events
SET start_date = '2026-04-16', end_date = '2026-04-19'
WHERE slug = 'did-2026';
