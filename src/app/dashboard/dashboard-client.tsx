'use client'

import { NotificationProvider } from '@/contexts/notification-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileHeader } from '@/components/layout/mobile-header'
import { SessionGuard } from '@/components/providers/session-guard'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'

export function DashboardClient({
  children,
}: {
  children: React.ReactNode
}) {
  // Test viewport width - initialize with a value that works on server
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  )
  
  useEffect(() => {
    const updateWidth = () => {
      setViewportWidth(window.innerWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <SessionGuard>
      <SidebarProvider>
        <NotificationProvider>
          <div className="flex h-screen bg-background">
            {/* Sidebar - Visible on desktop (lg and up), hidden on mobile/tablet */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <Sidebar />
            </aside>
            
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Desktop Header - Only when sidebar is visible */}
              <div style={{ display: viewportWidth >= 1024 ? 'block' : 'none' }}>
                <Header />
              </div>
              
              {/* Mobile/Tablet Header - Visible when sidebar is hidden */}
              <div style={{ display: viewportWidth < 1024 ? 'block' : 'none' }}>
                <MobileHeader className="supabase-header" />
              </div>
              
              {/* Main Content */}
              <main className="flex-1 overflow-y-auto p-6 lg:p-8" role="main" aria-label="Main content">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
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
    </SessionGuard>
  )
}