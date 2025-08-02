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
  
  // Determine device type based on viewport width - use correct initial value
  const getDeviceType = (width: number): 'mobile' | 'tablet' | 'desktop' => {
    if (width < 768) return 'mobile'
    if (width >= 768 && width < 1024) return 'tablet'
    return 'desktop'
  }
  
  // Always start with desktop to avoid hydration mismatch
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    // Mark as client-side
    setIsClient(true)
    
    const updateWidth = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      
      // Update device type
      setDeviceType(getDeviceType(width))
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Only on desktop */}
      {(!isClient || deviceType === 'desktop') && (
        <aside className={cn(
          "flex-shrink-0 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}>
          <Sidebar />
        </aside>
      )}
      
      {/* Tablet Sidebar - Only on tablet */}
      {isClient && deviceType === 'tablet' && <TabletSidebar />}
      
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300",
        deviceType === 'tablet' && "ml-[88px]"
      )}>
        {/* Desktop Header - Only on desktop */}
        {(!isClient || deviceType === 'desktop') && <Header />}
        
        {/* Tablet Header - Only on tablet */}
        {isClient && deviceType === 'tablet' && <TabletHeader />}
        
        {/* Mobile Header - Only on mobile */}
        {isClient && deviceType === 'mobile' && (
          <MobileHeader className="supabase-header" />
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto flex flex-col" role="main" aria-label="Main content">
          <div className={cn(
            "flex-1",
            deviceType === 'tablet' ? "px-6 py-6" : "p-6 lg:p-8"
          )}>
            <div className={cn(
              "h-full",
              deviceType === 'tablet' ? "max-w-none" : deviceType === 'desktop' && !isCollapsed ? "mx-auto max-w-7xl" : "max-w-none"
            )}>
              {children}
            </div>
          </div>
          
          {/* Footer */}
          <footer className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="px-4 py-2">
              <p className="text-xs text-muted-foreground/70 text-center font-medium tracking-wide">
                finding love in strange repos + hrvanovic
              </p>
            </div>
          </footer>
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