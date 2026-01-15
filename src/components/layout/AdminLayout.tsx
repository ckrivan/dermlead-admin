'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
