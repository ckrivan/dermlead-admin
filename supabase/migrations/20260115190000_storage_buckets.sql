-- =============================================================================
-- Storage Buckets Setup for Event Branding and Speaker Photos
-- =============================================================================
--
-- IMPORTANT: Storage buckets must be created manually via Supabase Dashboard
-- before this migration can apply the policies.
--
-- Steps to create buckets in Supabase Dashboard:
-- 1. Go to Storage in the Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Create bucket named "events" with:
--    - Name: events
--    - Public bucket: ENABLED (checked)
-- 4. Create bucket named "speakers" with:
--    - Name: speakers
--    - Public bucket: ENABLED (checked)
--
-- =============================================================================

-- Create the storage buckets (will error if they don't exist yet - create via dashboard first)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('events', 'events', true),
  ('speakers', 'speakers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Give public access to events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes in events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to speakers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to speakers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to speakers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes in speakers bucket" ON storage.objects;

-- =============================================================================
-- Events Bucket Policies (logos, banners, exhibitor images)
-- =============================================================================

-- Public read access for event files
CREATE POLICY "Give public access to events bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');

-- Authenticated users can upload to events bucket
CREATE POLICY "Allow authenticated uploads to events bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');

-- Authenticated users can update files in events bucket
CREATE POLICY "Allow authenticated updates to events bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'events');

-- Authenticated users can delete from events bucket
CREATE POLICY "Allow authenticated deletes in events bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events');

-- =============================================================================
-- Speakers Bucket Policies (speaker photos)
-- =============================================================================

-- Public read access for speaker files
CREATE POLICY "Give public access to speakers bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'speakers');

-- Authenticated users can upload to speakers bucket
CREATE POLICY "Allow authenticated uploads to speakers bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'speakers');

-- Authenticated users can update files in speakers bucket
CREATE POLICY "Allow authenticated updates to speakers bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'speakers');

-- Authenticated users can delete from speakers bucket
CREATE POLICY "Allow authenticated deletes in speakers bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'speakers');
