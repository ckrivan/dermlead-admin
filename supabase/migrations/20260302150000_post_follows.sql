-- Post follows: users subscribe to posts for comment notifications

CREATE TABLE IF NOT EXISTS post_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_follows_post ON post_follows(post_id);
CREATE INDEX idx_post_follows_user ON post_follows(user_id);

ALTER TABLE post_follows ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "post_follows_select" ON post_follows
    FOR SELECT USING (true);

-- Users manage own follows
CREATE POLICY "post_follows_insert" ON post_follows
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_follows_delete" ON post_follows
    FOR DELETE USING (user_id = auth.uid());
