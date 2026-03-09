-- Add UPDATE policy for event-photos storage bucket
-- Required for uploadBinary with upsert: true (used by event settings branding uploads)
CREATE POLICY "event_photos_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'event-photos')
WITH CHECK (bucket_id = 'event-photos');
