'use client'

import { ResponsiveSidebar } from './index'
import { defaultNavItems } from './navigation'
import { Header } from '../header'
import { MobileHeader } from '../mobile-header'
import { SidebarProvider } from '@/contexts/sidebar-context'

interface IntegratedLayoutProps {
  children: React.ReactNode
}

/**
 * Example of how to integrate ResponsiveSidebar into the existing layout
 * This can replace the current sidebar implementations
 */
export function IntegratedLayout({ children }: IntegratedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        {/* Responsive Sidebar - handles all breakpoints */}
        <ResponsiveSidebar 
          navItems={defaultNavItems}
          showLogo={true}
          enablePersistence={true}
          overlayBlur={true}
          breakpoints={{
            mobile: 767,
            tablet: 1023,
            desktop: 1279,
            wide: 1280
          }}
          customModeMap={{
            mobile: 'overlay',
            tablet: 'overlay', 
            desktop: 'collapsible',
            wide: 'persistent'
          }}
          onNavigate={(href) => {
            console.log(`Navigating to: ${href}`)
            // Add any custom navigation logic here
          }}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - visible on desktop and above */}
          <div className="hidden lg:block">
            <Header />
          </div>

          {/* Mobile Header - visible on mobile/tablet */}
          <div className="lg:hidden">
            <MobileHeader />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

/**
 * Alternative layout for gradual migration
 * Use this to gradually replace existing sidebar components
 */
export function GradualMigrationLayout({ children }: IntegratedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        {/* Use ResponsiveSidebar on large screens and above */}
        <div className="hidden xl:block">
          <ResponsiveSidebar />
        </div>

        {/* Keep existing components for smaller screens during migration */}
        <div className="xl:hidden">
          {/* Your existing mobile/tablet sidebar components */}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

/**
 * Custom themed layout example
 */
export function CustomThemedLayout({ children }: IntegratedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <ResponsiveSidebar 
          navItems={defaultNavItems}
          showLogo={true}
          logoComponent={
            <div className="flex h-16 items-center px-4">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <div>
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Custom CMS
                  </span>
                  <div className="text-xs text-muted-foreground">v2.0</div>
                </div>
              </div>
            </div>
          }
          className="border-r border-border/50 backdrop-blur-sm"
          overlayBlur={true}
          onNavigate={(href) => {
            // Custom analytics or navigation logic
            console.log(`Custom navigation to: ${href}`)
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default IntegratedLayout