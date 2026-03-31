'use client'

import { Bell, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { UserMenu } from './UserMenu'
import { useSidebar } from '@/contexts/SidebarContext'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { open, isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  return (
    <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <button
              onClick={open}
              className="p-2 -ml-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
            >
              <Menu size={22} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-[var(--foreground)] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--foreground-muted)] truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop search */}
          <div className="relative hidden md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)] transition-colors"
            />
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
          >
            {showMobileSearch ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-danger)] rounded-full" />
          </button>

          {/* User menu */}
          <UserMenu />
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {showMobileSearch && isMobile && (
        <div className="px-4 pb-3 border-t border-[var(--card-border)]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)] transition-colors"
            />
          </div>
        </div>
      )}
    </header>
  )
}
