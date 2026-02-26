'use client'

import { Bell, Search } from 'lucide-react'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--card-border)]">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--foreground-muted)]">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
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

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-danger)] rounded-full" />
          </button>

          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
