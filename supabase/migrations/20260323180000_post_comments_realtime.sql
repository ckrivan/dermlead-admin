DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE post_comments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
