-- Link speakers to attendees for attendee-speakers.
-- When an attendee gets 'speaker' in badge_types, a speakers record is auto-created
-- with attendee_id set. The attendee record is the source of truth; the speakers
-- record is auto-synced infrastructure for session assignment (session_speakers FK).

ALTER TABLE speakers ADD COLUMN IF NOT EXISTS attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL;
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);

-- Fast lookup of linked speaker by attendee_id
CREATE INDEX IF NOT EXISTS idx_speakers_attendee_id ON speakers(attendee_id) WHERE attendee_id IS NOT NULL;
