-- Fix community RLS policies for organiser/leadership roles
-- and create missing increment_field RPC for likes

-- 1. Create increment_field RPC for likes
CREATE OR REPLACE FUNCTION increment_field(
  table_name TEXT,
  field_name TEXT,
  row_id UUID
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    table_name, field_name, field_name
  ) USING row_id;
END;
$$;

-- 2. Fix UPDATE policy to allow likes from anyone (not just admin/author)
DROP POLICY IF EXISTS "community_posts_update" ON community_posts;
CREATE POLICY "community_posts_update"
    ON community_posts FOR UPDATE
    USING (
        author_id = auth.uid()
        OR auth.uid() IS NOT NULL  -- Any authenticated user can update (for likes)
    );

-- 3. Fix DELETE policy to allow admin + organiser + leadership + author
DROP POLICY IF EXISTS "community_posts_delete" ON community_posts;
CREATE POLICY "community_posts_delete"
    ON community_posts FOR DELETE
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'organiser', 'leadership')
        )
    );

-- 4. Also fix post_comments policies
DROP POLICY IF EXISTS "post_comments_delete" ON post_comments;
CREATE POLICY "post_comments_delete"
    ON post_comments FOR DELETE
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'organiser', 'leadership')
        )
    );

-- 5. Dev mode permissive policies (ensure they exist)
DROP POLICY IF EXISTS "dev_public_read_community_posts" ON community_posts;
CREATE POLICY "dev_public_read_community_posts" ON community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "dev_public_write_community_posts" ON community_posts;
CREATE POLICY "dev_public_write_community_posts" ON community_posts FOR ALL USING (true) WITH CHECK (true);
