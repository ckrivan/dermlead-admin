import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

export interface UserWithEmail extends Profile {
  email: string
}

export interface InviteUserData {
  email: string
  full_name: string
  role: 'admin' | 'rep'
  organization_id: string
}

export interface UpdateUserData {
  full_name?: string
  role?: 'admin' | 'rep'
  is_active?: boolean
}

/**
 * Get all users for an organization
 */
export async function getOrganizationUsers(organizationId: string): Promise<UserWithEmail[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  return data as UserWithEmail[]
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: string): Promise<UserWithEmail | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data as UserWithEmail
}

/**
 * Update a user's profile
 */
export async function updateUser(userId: string, updates: UpdateUserData): Promise<Profile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    throw error
  }

  return data
}

/**
 * Deactivate a user (soft delete)
 */
export async function deactivateUser(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

/**
 * Reactivate a user
 */
export async function reactivateUser(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) {
    console.error('Error reactivating user:', error)
    throw error
  }
}

/**
 * Invite a new user to the organization
 * This requires the service role key for admin.inviteUserByEmail
 * For now, we'll create the profile and the user can set up via magic link
 */
export async function inviteUser(inviteData: InviteUserData): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // First check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', inviteData.email)
    .single()

  if (existingUser) {
    return { success: false, error: 'A user with this email already exists' }
  }

  // Get current user for invited_by
  const { data: { user } } = await supabase.auth.getUser()

  // For a proper invite flow, we'd use admin.inviteUserByEmail
  // which requires service role key. For now, we create a pending profile
  // that will be linked when the user signs up

  // Note: In production, you'd call an Edge Function that has the service role key
  // to properly invite the user via Supabase auth

  // Create a placeholder profile with the invite data
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: crypto.randomUUID(), // Temporary ID, will be replaced when user signs up
      email: inviteData.email,
      full_name: inviteData.full_name,
      role: inviteData.role,
      organization_id: inviteData.organization_id,
      is_active: false, // Pending activation
      invited_by: user?.id || null,
      invited_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error inviting user:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Change a user's role
 */
export async function changeUserRole(userId: string, newRole: 'admin' | 'rep'): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error changing user role:', error)
    throw error
  }
}
