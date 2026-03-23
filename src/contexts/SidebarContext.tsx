'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface SidebarContextValue {
  isOpen: boolean
  isCollapsed: boolean
  isMobile: boolean
  toggle: () => void
  open: () => void
  close: () => void
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (!e.matches) setIsOpen(false) // close drawer when resizing to desktop
    }
    handleChange(mql)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const toggle = useCallback(() => {
    if (isMobile) {
      setIsOpen(prev => !prev)
    } else {
      setIsCollapsed(prev => !prev)
    }
  }, [isMobile])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), [])

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapsed, isMobile, toggle, open, close, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
