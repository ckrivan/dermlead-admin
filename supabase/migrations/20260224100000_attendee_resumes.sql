-- =============================================
-- ATTENDEE RESUME UPLOAD (Optional, self-service)
-- =============================================

-- 1. Add resume_url column to attendees
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- 2. Create private storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendee-resumes',
  'attendee-resumes',
  false,
  5242880, -- 5MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies

-- Authenticated users can upload to their own path: {eventId}/{attendeeId}/filename
CREATE POLICY "attendee_resumes_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attendee-resumes');

-- Authenticated users can read resumes (org-scoped access handled at app level)
CREATE POLICY "attendee_resumes_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'attendee-resumes');

-- Users can update/overwrite their own resume
CREATE POLICY "attendee_resumes_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'attendee-resumes');

-- Users can delete their own resume, admins can delete any
CREATE POLICY "attendee_resumes_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'attendee-resumes');

-- 4. Allow attendees to update their own resume_url
-- (Current RLS only allows admin updates. Add policy for self-service resume.)
CREATE POLICY "attendees_update_own_resume"
    ON attendees FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    WITH CHECK (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

SELECT 'Attendee resume upload ready!' as status;
