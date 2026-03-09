-- =============================================
-- Allow authenticated users to see all profiles
--
-- Problem: profiles_select_org restricts visibility to same-org only,
-- which breaks messaging contact lists at conventions where people
-- from different orgs need to message each other.
--
-- Solution: Add a SELECT policy for any authenticated user.
-- INSERT/UPDATE/DELETE policies remain tight (own profile only).
-- =============================================

CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

SELECT 'Profiles now visible to all authenticated users for messaging' as status;
