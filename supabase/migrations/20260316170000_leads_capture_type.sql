-- Add capture_type to distinguish exhibit hall leads from product theater attendance
ALTER TABLE leads ADD COLUMN IF NOT EXISTS capture_type TEXT DEFAULT 'exhibit';
