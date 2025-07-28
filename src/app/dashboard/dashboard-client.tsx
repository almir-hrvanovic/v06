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
            {/* Sidebar - Visible on desktop (md and up), hidden on mobile */}
            <div className="hidden md:block">
              <Sidebar />
            </div>
            
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile Header - Always visible on ALL screens */}
              <MobileHeader className="supabase-header" />
              
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