-- Add documents column to sessions (same pattern as sponsors/exhibitors)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]';

-- Create storage bucket for session documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('sessions', 'sessions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to session documents
CREATE POLICY "Public read session docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'sessions');

-- Allow authenticated users to upload session documents
CREATE POLICY "Authenticated upload session docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sessions');

-- Allow authenticated users to update/delete session documents
CREATE POLICY "Authenticated manage session docs" ON storage.objects
  FOR ALL USING (bucket_id = 'sessions');
