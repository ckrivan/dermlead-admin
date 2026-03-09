-- Dev/Demo: Allow public read access to leads for testing
-- This enables testing without strict auth requirements

-- First, let's check if the policy already exists and drop it
DROP POLICY IF EXISTS "Public can view leads" ON leads;
DROP POLICY IF EXISTS "Role-based lead visibility" ON leads;

-- Create a permissive policy for dev/testing
-- In production, you'd use the role-based policy instead
CREATE POLICY "Public can view leads"
    ON leads FOR SELECT
    USING (true);

-- Also ensure insert works for testing (any authenticated or anon)
DROP POLICY IF EXISTS "Users can create leads in org" ON leads;
DROP POLICY IF EXISTS "Anyone can create leads" ON leads;

CREATE POLICY "Anyone can create leads"
    ON leads FOR INSERT
    WITH CHECK (true);

-- Allow updates for testing
DROP POLICY IF EXISTS "Role-based lead updates" ON leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON leads;

CREATE POLICY "Anyone can update leads"
    ON leads FOR UPDATE
    USING (true);

-- Allow deletes for testing
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
DROP POLICY IF EXISTS "Anyone can delete leads" ON leads;

CREATE POLICY "Anyone can delete leads"
    ON leads FOR DELETE
    USING (true);

SELECT 'Dev leads access policies created!' as status;
