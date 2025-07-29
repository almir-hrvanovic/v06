'use client'

import { NotificationProvider } from '@/contexts/notification-context'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { TabletSidebarProvider, useTabletSidebar } from '@/contexts/tablet-sidebar-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileHeader } from '@/components/layout/mobile-header'
import { TabletHeader } from '@/components/layout/tablet-header'
import { TabletSidebar } from '@/components/layout/tablet-sidebar'
import { SessionGuard } from '@/components/providers/session-guard'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed } = useSidebar()
  // Test viewport width - initialize with a value that works on server
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )
  
  // Determine device type based on viewport width
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  
  useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      
      // Device type breakpoints
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width >= 768 && width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Only on desktop */}
      {deviceType === 'desktop' && (
        <aside className={cn(
          "flex-shrink-0 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}>
          <Sidebar />
        </aside>
      )}
      
      {/* Tablet Sidebar - Only on tablet */}
      {deviceType === 'tablet' && <TabletSidebar />}
      
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300",
        deviceType === 'tablet' && "ml-[88px]"
      )}>
        {/* Desktop Header - Only on desktop */}
        {deviceType === 'desktop' && <Header />}
        
        {/* Tablet Header - Only on tablet */}
        {deviceType === 'tablet' && <TabletHeader />}
        
        {/* Mobile Header - Only on mobile */}
        {deviceType === 'mobile' && (
          <MobileHeader className="supabase-header" />
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto" role="main" aria-label="Main content">
          <div className={cn(
            "h-full",
            deviceType === 'tablet' ? "px-6 py-6" : "p-6 lg:p-8"
          )}>
            <div className={cn(
              "h-full",
              deviceType === 'tablet' ? "max-w-none" : deviceType === 'desktop' && !isCollapsed ? "mx-auto max-w-7xl" : "max-w-none"
            )}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export function DashboardClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionGuard>
      <CurrencyProvider>
        <SidebarProvider>
          <NotificationProvider>
            <DashboardContent>{children}</DashboardContent>
            <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                }
              }}
            />
          </NotificationProvider>
        </SidebarProvider>
      </CurrencyProvider>
    </SessionGuard>
  )
}