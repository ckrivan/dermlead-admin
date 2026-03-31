-- Add documents JSONB column to sponsors and exhibitors
-- Stores array of {title: string, url: string} objects for PDF literature

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
