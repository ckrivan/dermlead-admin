-- =============================================
-- COMMUNITY BOARD + ANNOUNCEMENTS
-- Tables: community_posts, post_comments
-- =============================================

-- =============================================
-- 1. community_posts
-- =============================================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('announcement', 'discussion', 'question')),
    is_pinned BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: open read for dev + authenticated
CREATE POLICY "community_posts_select"
    ON community_posts FOR SELECT
    USING (true);

-- INSERT: authenticated or dev
CREATE POLICY "community_posts_insert"
    ON community_posts FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

-- UPDATE: admin for announcements, author for own posts
CREATE POLICY "community_posts_update"
    ON community_posts FOR UPDATE
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- DELETE: admin only
CREATE POLICY "community_posts_delete"
    ON community_posts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- 2. post_comments
-- =============================================
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: open read
CREATE POLICY "post_comments_select"
    ON post_comments FOR SELECT
    USING (true);

-- INSERT: authenticated or dev
CREATE POLICY "post_comments_insert"
    ON post_comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

-- UPDATE: author only
CREATE POLICY "post_comments_update"
    ON post_comments FOR UPDATE
    USING (author_id = auth.uid());

-- DELETE: admin only
CREATE POLICY "post_comments_delete"
    ON post_comments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- =============================================
-- 3. INDEXES
-- =============================================
CREATE INDEX idx_community_posts_event ON community_posts(event_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- =============================================
-- 4. SEED DEMO DATA
-- =============================================
DO $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Get the first event
    SELECT id INTO v_event_id FROM events LIMIT 1;

    IF v_event_id IS NOT NULL THEN
        -- Announcement 1 (pinned)
        INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at)
        VALUES (
            v_event_id,
            'Dr. Sarah Chen',
            'Welcome to DermConnect 2026!',
            'We are thrilled to welcome everyone to this year''s conference. Please check the agenda for session times and don''t forget to visit our exhibitor hall on the ground floor. Wi-Fi password: DermConnect2026. Looking forward to an amazing event!',
            'announcement',
            true,
            12,
            3,
            NOW() - INTERVAL '2 days'
        );

        -- Announcement 2 (pinned)
        INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at)
        VALUES (
            v_event_id,
            'Event Organizer',
            'Schedule Change: Keynote moved to Hall A',
            'Due to high demand, tomorrow''s keynote presentation by Dr. James Mitchell has been relocated to Hall A to accommodate more attendees. Doors open at 8:30 AM. Please plan accordingly.',
            'announcement',
            true,
            8,
            2,
            NOW() - INTERVAL '1 day'
        );

        -- Discussion 1
        INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at)
        VALUES (
            v_event_id,
            'Dr. Michael Torres',
            'Best restaurants near the venue?',
            'First time attending in this city. Any recommendations for dinner tonight? Preferably within walking distance of the convention center. Open to any cuisine!',
            'discussion',
            false,
            5,
            4,
            NOW() - INTERVAL '6 hours'
        );

        -- Discussion 2
        INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at)
        VALUES (
            v_event_id,
            'Dr. Emily Park',
            'Anyone interested in a running group tomorrow morning?',
            'Planning a casual 5K run at 6:30 AM tomorrow starting from the hotel lobby. All paces welcome! Great way to start the day before sessions begin.',
            'discussion',
            false,
            7,
            2,
            NOW() - INTERVAL '3 hours'
        );

        -- Question 1
        INSERT INTO community_posts (event_id, author_name, title, content, post_type, is_pinned, likes_count, comments_count, created_at)
        VALUES (
            v_event_id,
            'Dr. Alex Rivera',
            'CME credits - how do I claim them?',
            'I attended three sessions today but I am not sure how to submit for CME credits. Is there a form to fill out or is it done through the app? Any guidance would be appreciated.',
            'question',
            false,
            3,
            3,
            NOW() - INTERVAL '1 hour'
        );

        -- Add comments to discussion 1 (restaurants)
        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Dr. Lisa Wang', 'Try Osteria Roma on 5th Street - amazing Italian food and only a 10 minute walk!', NOW() - INTERVAL '5 hours'
        FROM community_posts cp WHERE cp.title = 'Best restaurants near the venue?' AND cp.event_id = v_event_id;

        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Dr. James Kim', 'The sushi place on Market Street is excellent. We went last night with a group.', NOW() - INTERVAL '4 hours'
        FROM community_posts cp WHERE cp.title = 'Best restaurants near the venue?' AND cp.event_id = v_event_id;

        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Dr. Sarah Chen', 'If you want something quick, the food court in the convention center has decent options too.', NOW() - INTERVAL '2 hours'
        FROM community_posts cp WHERE cp.title = 'Best restaurants near the venue?' AND cp.event_id = v_event_id;

        -- Add comments to the welcome announcement
        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Dr. Robert Hayes', 'Excited to be here! The venue looks great this year.', NOW() - INTERVAL '1 day'
        FROM community_posts cp WHERE cp.title = 'Welcome to DermConnect 2026!' AND cp.event_id = v_event_id;

        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Dr. Amanda Foster', 'Thank you for organizing such a wonderful event!', NOW() - INTERVAL '18 hours'
        FROM community_posts cp WHERE cp.title = 'Welcome to DermConnect 2026!' AND cp.event_id = v_event_id;

        -- Add comments to CME question
        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Event Organizer', 'You can claim CME credits through the app under Settings > CME Credits. Make sure to scan the QR code at each session you attend.', NOW() - INTERVAL '45 minutes'
        FROM community_posts cp WHERE cp.title = 'CME credits - how do I claim them?' AND cp.event_id = v_event_id;

        INSERT INTO post_comments (post_id, author_name, content, created_at)
        SELECT cp.id, 'Dr. Michael Torres', 'Thanks for asking this - I had the same question!', NOW() - INTERVAL '30 minutes'
        FROM community_posts cp WHERE cp.title = 'CME credits - how do I claim them?' AND cp.event_id = v_event_id;
    END IF;
END $$;
