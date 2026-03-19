-- Add community_post_id to link announcements to their community_posts
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS community_post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_announcements_community_post_id ON announcements(community_post_id) WHERE community_post_id IS NOT NULL;

-- Trigger: auto-create an announcements row when a community_posts announcement is inserted
-- Skips if an announcement already links to this community post (admin panel flow)
CREATE OR REPLACE FUNCTION sync_community_post_to_announcements()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.post_type = 'announcement' THEN
    -- Only create if no announcement already references this community post
    IF NOT EXISTS (SELECT 1 FROM announcements WHERE community_post_id = NEW.id) THEN
      INSERT INTO announcements (event_id, title, message, sender_name, sent_at, community_post_id, created_at, updated_at)
      VALUES (NEW.event_id, NEW.title, NEW.content, NEW.author_name, NEW.created_at, NEW.id, NEW.created_at, NEW.created_at);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_community_announcement ON community_posts;
CREATE TRIGGER trg_sync_community_announcement
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_community_post_to_announcements();

-- Backfill: insert existing community_posts announcements into announcements table
INSERT INTO announcements (event_id, title, message, sender_name, sent_at, community_post_id, created_at, updated_at)
SELECT cp.event_id, cp.title, cp.content, cp.author_name, cp.created_at, cp.id, cp.created_at, cp.created_at
FROM community_posts cp
WHERE cp.post_type = 'announcement'
  AND NOT EXISTS (
    SELECT 1 FROM announcements a WHERE a.community_post_id = cp.id
  );
