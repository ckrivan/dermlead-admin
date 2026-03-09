-- Enable Supabase Realtime for messaging tables
-- This allows .stream() and Realtime channel subscriptions to work

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
