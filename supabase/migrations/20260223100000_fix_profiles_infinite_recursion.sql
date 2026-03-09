-- =============================================
-- FIX: Infinite recursion in profiles RLS policy
--
-- Problem: profiles_select_org policy queries profiles table
-- inside a policy ON profiles → infinite recursion (42P17)
--
-- Solution: SECURITY DEFINER function bypasses RLS to get
-- the current user's organization_id safely.
-- =============================================

-- 1. Create helper function (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "profiles_select_org" ON profiles;

-- 3. Re-create it using the safe helper function
CREATE POLICY "profiles_select_org"
    ON profiles FOR SELECT
    USING (organization_id = public.get_my_organization_id());

SELECT 'Fixed profiles infinite recursion!' as status;
