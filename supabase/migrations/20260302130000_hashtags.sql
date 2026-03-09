-- Unified hashtag system for photos, community posts, and comments

-- Master hashtag table (event-scoped)
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, tag)
);

-- Photos <-> hashtags junction
CREATE TABLE IF NOT EXISTS photo_hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, hashtag_id)
);

-- Community posts <-> hashtags junction
CREATE TABLE IF NOT EXISTS post_hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, hashtag_id)
);

-- Comment <-> hashtags junction
CREATE TABLE IF NOT EXISTS comment_hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, hashtag_id)
);

-- Indexes
CREATE INDEX idx_hashtags_event ON hashtags(event_id);
CREATE INDEX idx_hashtags_usage ON hashtags(usage_count DESC);
CREATE INDEX idx_photo_hashtags_photo ON photo_hashtags(photo_id);
CREATE INDEX idx_photo_hashtags_hashtag ON photo_hashtags(hashtag_id);
CREATE INDEX idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);
CREATE INDEX idx_comment_hashtags_comment ON comment_hashtags(comment_id);
CREATE INDEX idx_comment_hashtags_hashtag ON comment_hashtags(hashtag_id);

-- RLS
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_hashtags ENABLE ROW LEVEL SECURITY;

-- Public read on all
CREATE POLICY "hashtags_select" ON hashtags FOR SELECT USING (true);
CREATE POLICY "photo_hashtags_select" ON photo_hashtags FOR SELECT USING (true);
CREATE POLICY "post_hashtags_select" ON post_hashtags FOR SELECT USING (true);
CREATE POLICY "comment_hashtags_select" ON comment_hashtags FOR SELECT USING (true);

-- Authenticated insert
CREATE POLICY "hashtags_insert" ON hashtags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "photo_hashtags_insert" ON photo_hashtags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "post_hashtags_insert" ON post_hashtags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comment_hashtags_insert" ON comment_hashtags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Admin delete
CREATE POLICY "hashtags_delete" ON hashtags FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "photo_hashtags_delete" ON photo_hashtags FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "post_hashtags_delete" ON post_hashtags FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "comment_hashtags_delete" ON comment_hashtags FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
