-- Fix storage policies to allow anon uploads (dev mode)
-- The existing policies only allow 'authenticated' role,
-- but the admin panel uses the anon key.

-- Drop restrictive policies
DROP POLICY IF EXISTS "Allow authenticated uploads to events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes in events bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to speakers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to speakers bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes in speakers bucket" ON storage.objects;

-- Dev-mode permissive policies for events bucket
CREATE POLICY "Allow public uploads to events bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'events');

CREATE POLICY "Allow public updates to events bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'events');

CREATE POLICY "Allow public deletes in events bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'events');

-- Dev-mode permissive policies for speakers bucket
CREATE POLICY "Allow public uploads to speakers bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'speakers');

CREATE POLICY "Allow public updates to speakers bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'speakers');

CREATE POLICY "Allow public deletes in speakers bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'speakers');
