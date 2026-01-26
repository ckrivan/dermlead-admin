'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Presentation,
  UsersRound,
  Megaphone,
  Palette,
  Building2,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Attendees', href: '/attendees', icon: UserCheck },
  { name: 'Speakers', href: '/speakers', icon: Users },
  { name: 'Sessions', href: '/sessions', icon: Presentation },
  { name: 'Groups', href: '/groups', icon: UsersRound },
  { name: 'Exhibitors', href: '/exhibitors', icon: Building2 },
  { name: 'Sponsors', href: '/sponsors', icon: Award },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Branding', href: '/branding', icon: Palette },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[var(--sidebar-gradient-from)] to-[var(--sidebar-gradient-to)] shadow-lg transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/20">
        {!collapsed && (
          <span className="text-xl font-bold text-white">
            Converge
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 py-4 border-t border-white/20">
        <button
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
