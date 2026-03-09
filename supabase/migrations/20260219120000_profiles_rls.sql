-- =============================================
-- PROFILES RLS POLICIES
-- Users must be able to read/write their own profile for sign-up and sign-in to work.
-- Without these policies, new users get stuck after account creation.
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_org" ON profiles;

-- Users can read their own profile (needed for auth flow / profile completion check)
CREATE POLICY "profiles_select_own"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users in the same org can see each other (needed for messaging, community, etc.)
CREATE POLICY "profiles_select_org"
    ON profiles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can create their own profile (needed for first-time sign-up)
CREATE POLICY "profiles_insert_own"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

SELECT 'Profiles RLS policies applied!' as status;
