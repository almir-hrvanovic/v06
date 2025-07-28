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
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar - Hidden on mobile, visible on desktop */}
            <Sidebar />
            
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile Header - Always visible on ALL screens */}
              <MobileHeader />
              
              {/* Desktop Header - Hidden on all screens */}
              {/* <Header /> */}
              
              {/* Main Content */}
              <main className="flex-1 overflow-y-auto p-4" role="main" aria-label="Main content">
                {children}
              </main>
            </div>
          </div>
          <Toaster position="top-right" />
        </NotificationProvider>
      </SidebarProvider>
    </SessionGuard>
  )
}