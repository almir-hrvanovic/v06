'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface TabletSidebarContextType {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

const TabletSidebarContext = createContext<TabletSidebarContextType | undefined>(undefined)

export function TabletSidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <TabletSidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </TabletSidebarContext.Provider>
  )
}

export function useTabletSidebar() {
  const context = useContext(TabletSidebarContext)
  if (context === undefined) {
    throw new Error('useTabletSidebar must be used within a TabletSidebarProvider')
  }
  return context
}