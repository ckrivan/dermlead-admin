import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export interface SignInResult {
  success: boolean
  error?: string
  needsAdminRole?: boolean
}

export async function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data.user) {
    return { success: false, error: 'No user returned' }
  }

  // Check if user has admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    // Sign out and return error
    await supabase.auth.signOut()
    return { success: false, error: 'Profile not found. Contact administrator.' }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been deactivated.' }
  }

  if (profile.role !== 'admin') {
    await supabase.auth.signOut()
    return { success: false, error: 'Admin access required.', needsAdminRole: true }
  }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function changePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
