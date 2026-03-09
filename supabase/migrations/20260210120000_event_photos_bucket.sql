-- Create storage bucket for event photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "event_photos_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-photos');

-- Allow public read (bucket is public)
CREATE POLICY "event_photos_read" ON storage.objects
FOR SELECT
USING (bucket_id = 'event-photos');

-- Allow owner or admin to delete
CREATE POLICY "event_photos_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (
    (auth.uid())::text = (storage.foldername(name))[2]
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
