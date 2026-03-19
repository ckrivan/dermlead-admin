import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

export interface UserWithEmail extends Profile {
  email: string
}

export interface InviteUserData {
  email: string
  full_name: string
  role: 'admin' | 'staff' | 'leader' | 'rep' | 'attendee' | 'auditor'
  organization_id: string
}

export interface UpdateUserData {
  full_name?: string
  role?: 'admin' | 'staff' | 'leader' | 'rep' | 'attendee' | 'auditor'
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
    .in('role', ['admin', 'leader', 'rep'])
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
 * Update a user's profile.
 * Routes through server API to bypass RLS.
 */
export async function updateUser(userId: string, updates: UpdateUserData): Promise<Profile> {
  const res = await fetch('/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, updates }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update user')
  }

  return data
}

/**
 * Deactivate a user (soft delete) and revoke all their auth sessions.
 * Routes through dedicated server API that uses service_role key to
 * set is_active=false and call auth.admin.signOut to invalidate tokens.
 */
export async function deactivateUser(userId: string): Promise<void> {
  const res = await fetch('/api/users/deactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to deactivate user')
  }
}

/**
 * Reactivate a deactivated user.
 * Routes through dedicated server API that uses service_role key.
 */
export async function reactivateUser(userId: string): Promise<void> {
  const res = await fetch('/api/users/reactivate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to reactivate user')
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
 * Change a user's role.
 * Routes through server API to bypass RLS.
 */
export async function changeUserRole(userId: string, newRole: 'admin' | 'staff' | 'leader' | 'rep' | 'attendee' | 'auditor'): Promise<void> {
  const res = await fetch('/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, updates: { role: newRole } }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to change user role')
  }
}
