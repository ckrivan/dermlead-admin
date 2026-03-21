-- Configurable lead access window per event.
-- After the event ends, reps can download leads for this many days.
-- After that, lead access expires entirely.
ALTER TABLE events ADD COLUMN IF NOT EXISTS lead_access_days INTEGER NOT NULL DEFAULT 14;
