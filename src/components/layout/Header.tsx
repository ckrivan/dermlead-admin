'use client'

import { Bell, Menu, Moon, Search, Sun, X, Users, Mic, Calendar, Building2, Award } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { UserMenu } from './UserMenu'
import { useSidebar } from '@/contexts/SidebarContext'
// Search is global across all events
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title: string
  subtitle?: string
}

interface SearchResult {
  id: string
  label: string
  sublabel?: string
  type: 'attendee' | 'speaker' | 'session' | 'exhibitor' | 'sponsor'
  href: string
}

const TYPE_META: Record<SearchResult['type'], { icon: typeof Users; color: string; label: string }> = {
  attendee: { icon: Users, color: 'text-green-500', label: 'Attendee' },
  speaker: { icon: Mic, color: 'text-orange-500', label: 'Speaker' },
  session: { icon: Calendar, color: 'text-purple-500', label: 'Session' },
  exhibitor: { icon: Building2, color: 'text-indigo-500', label: 'Exhibitor' },
  sponsor: { icon: Award, color: 'text-yellow-500', label: 'Sponsor' },
}

export function Header({ title, subtitle }: HeaderProps) {
  const { open, isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const supabase = createClient()
      const term = q.trim().toLowerCase()

      const [attendees, speakers, sessions, exhibitors, sponsors] = await Promise.all([
        supabase
          .from('attendees')
          .select('id, first_name, last_name, email, badge_type, institution')
          .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,institution.ilike.%${term}%`)
          .order('last_name')
          .limit(8),
        supabase
          .from('speakers')
          .select('id, full_name, title, role')
          .or(`full_name.ilike.%${term}%,title.ilike.%${term}%`)
          .limit(5),
        supabase
          .from('sessions')
          .select('id, title, session_type')
          .ilike('title', `%${term}%`)
          .limit(5),
        supabase
          .from('exhibitors')
          .select('id, company_name, booth_number')
          .ilike('company_name', `%${term}%`)
          .limit(5),
        supabase
          .from('sponsors')
          .select('id, company_name, tier')
          .ilike('company_name', `%${term}%`)
          .limit(5),
      ])

      const mapped: SearchResult[] = [
        ...(attendees.data || []).map((a: Record<string, string>) => ({
          id: a.id,
          label: `${a.first_name} ${a.last_name}`,
          sublabel: [a.badge_type, a.institution].filter(Boolean).join(' \u00b7 '),
          type: 'attendee' as const,
          href: `/attendees?q=${encodeURIComponent(a.first_name + ' ' + a.last_name)}`,
        })),
        ...(speakers.data || []).map((s: Record<string, string | string[]>) => ({
          id: s.id as string,
          label: s.full_name as string,
          sublabel: (s.title as string) || ((s.role as string[]) || []).join(', '),
          type: 'speaker' as const,
          href: `/speakers/${s.id}/edit`,
        })),
        ...(sessions.data || []).map((s: Record<string, string>) => ({
          id: s.id,
          label: s.title,
          sublabel: s.session_type || undefined,
          type: 'session' as const,
          href: `/sessions/${s.id}/edit`,
        })),
        ...(exhibitors.data || []).map((e: Record<string, string>) => ({
          id: e.id,
          label: e.company_name,
          sublabel: e.booth_number ? `Booth ${e.booth_number}` : undefined,
          type: 'exhibitor' as const,
          href: `/industry-partners?q=${encodeURIComponent(e.company_name)}`,
        })),
        ...(sponsors.data || []).map((s: Record<string, string>) => ({
          id: s.id,
          label: s.company_name,
          sublabel: s.tier || undefined,
          type: 'sponsor' as const,
          href: `/industry-partners?q=${encodeURIComponent(s.company_name)}`,
        })),
      ]

      setResults(mapped)
      setSelectedIndex(-1)
    } catch (e) {
      console.error('Global search error:', e)
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    setShowResults(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const handleSelect = (result: SearchResult) => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setShowMobileSearch(false)
    router.push(result.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const renderResults = () => {
    if (!showResults || query.trim().length < 2) return null
    return (
      <div className="absolute z-50 mt-1 w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-xl max-h-80 overflow-y-auto">
        {searching ? (
          <p className="px-4 py-3 text-sm text-[var(--foreground-muted)]">Searching...</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[var(--foreground-muted)]">No results found</p>
        ) : (
          results.map((r, i) => {
            const meta = TYPE_META[r.type]
            const Icon = meta.icon
            return (
              <button
                key={`${r.type}-${r.id}`}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--background-tertiary)] transition-colors ${
                  i === selectedIndex ? 'bg-[var(--background-tertiary)]' : ''
                }`}
                onClick={() => handleSelect(r)}
              >
                <Icon size={16} className={meta.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{r.label}</p>
                  {r.sublabel && (
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{r.sublabel}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color} bg-[var(--background-tertiary)]`}>
                  {meta.label}
                </span>
              </button>
            )
          })
        )}
      </div>
    )
  }

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
          <div className="relative hidden md:block" ref={searchRef}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--input-focus)] transition-colors"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => query.trim().length >= 2 && setShowResults(true)}
              onKeyDown={handleKeyDown}
            />
            {renderResults()}
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
        <div className="px-4 pb-3 border-t border-[var(--card-border)]" ref={mobileSearchRef}>
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
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {renderResults()}
          </div>
        </div>
      )}
    </header>
  )
}
