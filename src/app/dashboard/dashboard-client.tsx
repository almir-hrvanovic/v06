'use client'

import { NotificationProvider } from '@/contexts/notification-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileHeader } from '@/components/layout/mobile-header'
import { SessionGuard } from '@/components/providers/session-guard'
import { Toaster } from 'sonner'

export function DashboardClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionGuard>
      <SidebarProvider>
        <NotificationProvider>
          <div className="flex h-screen bg-background">
            {/* Sidebar - Visible on desktop (xl and up), hidden on mobile/tablet */}
            <div className="hidden xl:block">
              <Sidebar />
            </div>
            
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Desktop Header - Only when sidebar is visible */}
              <div className="hidden xl:block">
                <Header />
              </div>
              
              {/* Mobile/Tablet Header - Visible when sidebar is hidden */}
              <div className="xl:hidden">
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