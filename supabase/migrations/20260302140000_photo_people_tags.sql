-- Photo people tagging: tag attendees/users who appear in photos

CREATE TABLE IF NOT EXISTS photo_people_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
    tagged_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tagged_attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
    tagged_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- At least one of tagged_user_id or tagged_attendee_id must be set
    CONSTRAINT photo_people_tags_target CHECK (
        tagged_user_id IS NOT NULL OR tagged_attendee_id IS NOT NULL
    )
);

-- Prevent duplicate tags for the same person on the same photo
CREATE UNIQUE INDEX idx_photo_people_unique_user
    ON photo_people_tags(photo_id, tagged_user_id)
    WHERE tagged_user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_photo_people_unique_attendee
    ON photo_people_tags(photo_id, tagged_attendee_id)
    WHERE tagged_attendee_id IS NOT NULL;

CREATE INDEX idx_photo_people_photo ON photo_people_tags(photo_id);
CREATE INDEX idx_photo_people_user ON photo_people_tags(tagged_user_id);
CREATE INDEX idx_photo_people_attendee ON photo_people_tags(tagged_attendee_id);

ALTER TABLE photo_people_tags ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "photo_people_tags_select" ON photo_people_tags
    FOR SELECT USING (true);

-- Authenticated insert
CREATE POLICY "photo_people_tags_insert" ON photo_people_tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Delete: tagger, tagged user, photo uploader, or admin
CREATE POLICY "photo_people_tags_delete" ON photo_people_tags
    FOR DELETE USING (
        tagged_by = auth.uid()
        OR tagged_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM event_photos
            WHERE id = photo_id AND uploaded_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
