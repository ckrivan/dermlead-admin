-- Add Instagram URL to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
