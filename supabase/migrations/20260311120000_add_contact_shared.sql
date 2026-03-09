-- Add contact_shared opt-in flag for lead retrieval
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_shared BOOLEAN DEFAULT false;
