-- Change default for new profiles: emails hidden by default
ALTER TABLE profiles ALTER COLUMN show_email SET DEFAULT false;

-- Update existing profiles to hide email by default
UPDATE profiles SET show_email = false WHERE show_email = true;
