-- Drop old CHECK constraint and add product_theater as valid session type
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check
  CHECK (session_type IN ('keynote', 'presentation', 'product_theater', 'workshop', 'panel', 'symposium', 'breakout', 'networking', 'meal', 'break', 'registration', 'exhibition', 'other'));

-- Update existing product theater sessions from symposium to product_theater
UPDATE sessions SET session_type = 'product_theater' WHERE title ILIKE '%product%theater%' AND session_type = 'symposium';
