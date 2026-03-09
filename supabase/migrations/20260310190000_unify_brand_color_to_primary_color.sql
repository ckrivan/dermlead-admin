-- Unify brand_color and primary_color columns on events table.
-- Admin panel used brand_color; Flutter app uses primary_color.
-- Copy any brand_color values to primary_color, then drop brand_color.

UPDATE events
SET primary_color = COALESCE(primary_color, brand_color)
WHERE brand_color IS NOT NULL AND primary_color IS NULL;

ALTER TABLE events DROP COLUMN IF EXISTS brand_color;
