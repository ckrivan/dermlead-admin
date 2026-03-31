-- Lead access control: paid feature requiring explicit admin activation.
--
-- Company level (sponsors/exhibitors): tracks which companies have paid for lead access.
-- Attendee level: controls which specific people can capture leads in the app.
-- The app checks attendees.leads_access — not every person from a paying company gets it.

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS leads_enabled BOOLEAN DEFAULT false;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS leads_enabled BOOLEAN DEFAULT false;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS leads_access BOOLEAN DEFAULT false;
