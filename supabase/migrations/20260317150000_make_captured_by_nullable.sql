-- Make leads.captured_by nullable so we can preserve leads when a user is deleted
ALTER TABLE leads ALTER COLUMN captured_by DROP NOT NULL;
