import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

export interface UserWithEmail extends Profile {
  email: string
}

export interface InviteUserData {
  email: string
  full_name: string
  role: 'admin' | 'rep' | 'attendee' | 'auditor'
  organization_id: string
}

export interface UpdateUserData {
  full_name?: string
  role?: 'admin' | 'rep' | 'attendee' | 'auditor'
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
 * Invite a new user to the organization.
 * Calls the server-side API route which uses the service_role key
 * to create the auth user, send a magic link, and set up the profile.
 */
export async function inviteUser(inviteData: InviteUserData): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inviteData),
  })

  const data = await res.json()

  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to invite user' }
  }

  return { success: true }
}

/**
 * Delete a user permanently.
 * Calls server-side API route which uses service_role key to bypass RLS.
 */
export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch('/api/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to delete user')
  }
}

/**
 * Change a user's role
 */
export async function changeUserRole(userId: string, newRole: 'admin' | 'rep' | 'attendee' | 'auditor'): Promise<void> {
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
