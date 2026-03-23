'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

interface AdminLayoutProps {
  children: ReactNode
}

function LayoutShell({ children }: { children: ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar()

  const mainMargin = isMobile
    ? 'ml-0'
    : isCollapsed
      ? 'ml-16'
      : 'ml-64'

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className={`${mainMargin} transition-all duration-300`}>
        {children}
      </main>
    </div>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutShell>{children}</LayoutShell>
    </SidebarProvider>
  )
}
