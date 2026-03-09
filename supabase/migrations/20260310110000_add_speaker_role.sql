-- Add role column to speakers table (faculty, leader, guest)
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'faculty';
