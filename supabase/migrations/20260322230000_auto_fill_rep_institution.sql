-- Auto-fill institution from organization for reps
-- When a profile with role='rep' is created/updated with an organization_id but no institution,
-- automatically fill institution from the organizations table

CREATE OR REPLACE FUNCTION auto_fill_rep_institution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for reps with an org but no institution
  IF (NEW.role = 'rep' AND NEW.organization_id IS NOT NULL AND (NEW.institution IS NULL OR NEW.institution = '')) THEN
    SELECT name INTO NEW.institution
    FROM organizations
    WHERE id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_fill_rep_institution ON profiles;
CREATE TRIGGER trg_auto_fill_rep_institution
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_fill_rep_institution();

-- Also backfill any existing reps missing institution
UPDATE profiles p
SET institution = o.name
FROM organizations o
WHERE p.role = 'rep'
  AND p.organization_id = o.id
  AND (p.institution IS NULL OR p.institution = '');

-- And sync institution to attendee records for linked reps
UPDATE attendees a
SET institution = p.institution
FROM profiles p
WHERE a.profile_id = p.id
  AND p.role = 'rep'
  AND p.institution IS NOT NULL
  AND (a.institution IS NULL OR a.institution = '');
