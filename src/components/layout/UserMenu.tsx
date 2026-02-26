'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function UserMenu() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
            <span className="text-sm font-medium text-white">{initials}</span>
          </div>
        )}
        <span className="text-sm font-medium text-[var(--foreground)] hidden sm:block">
          {displayName}
        </span>
        <ChevronDown
          size={16}
          className={`text-[var(--foreground-muted)] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-lg py-1 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[var(--card-border)]">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {displayName}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] truncate">
              {user?.email}
            </p>
            {profile?.role && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                {profile.role}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/settings')
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
            >
              <User size={16} className="text-[var(--foreground-muted)]" />
              My Profile
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/settings')
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
            >
              <Settings size={16} className="text-[var(--foreground-muted)]" />
              Settings
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-[var(--card-border)] py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
