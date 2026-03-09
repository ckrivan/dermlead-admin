-- Add exhibitor as a sponsor tier (lowest level)
ALTER TABLE sponsors DROP CONSTRAINT IF EXISTS sponsors_tier_check;
ALTER TABLE sponsors ADD CONSTRAINT sponsors_tier_check
  CHECK (tier IN ('title_sponsor', 'presidents_circle', 'bronze', 'exhibitor'));
