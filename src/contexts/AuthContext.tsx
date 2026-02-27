'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Organization } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  organization: Organization | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useRef(createClient()).current

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) {
      setProfile(profileData)

      // Fetch organization if profile has one
      if (profileData.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single()

        if (orgData) {
          setOrganization(orgData)
        }
      }

      // Update last login timestamp
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setOrganization(null)
    setSession(null)
  }

  useEffect(() => {
    // Safety net: if auth hangs for any reason (stale cookies, network, etc.)
    // force-clear and redirect to login rather than spinning forever.
    const safetyTimer = setTimeout(() => {
      console.warn('[AuthContext] auth init timed out — clearing session')
      setLoading(false)                       // guaranteed — runs synchronously
      supabase.auth.signOut().catch(() => {}) // best-effort cleanup, non-blocking
    }, 8000)

    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id)
        }
      } catch (err) {
        console.error('[AuthContext] initAuth failed:', err)
      } finally {
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, newSession: Session | null) => {
      try {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
          setOrganization(null)
        }
      } catch (err) {
        console.error('[AuthContext] auth state change failed:', err)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        session,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
