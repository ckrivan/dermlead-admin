-- Convert speakers.role from TEXT to TEXT[] for multi-role support
-- (e.g., a speaker can be both 'faculty' and 'leader')
ALTER TABLE speakers ALTER COLUMN role SET DEFAULT NULL;
ALTER TABLE speakers ALTER COLUMN role TYPE TEXT[] USING ARRAY[COALESCE(role, 'faculty')];
ALTER TABLE speakers ALTER COLUMN role SET DEFAULT ARRAY['faculty']::TEXT[];
ALTER TABLE speakers ALTER COLUMN role SET NOT NULL;
