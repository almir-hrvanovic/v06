'use client'

import { ResponsiveSidebar } from './index'
import { SidebarProvider } from '@/contexts/sidebar-context'

// Demo component to test ResponsiveSidebar
export function ResponsiveSidebarDemo() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <ResponsiveSidebar 
          className="border-r border-gray-200 dark:border-gray-700"
          onNavigate={(href) => console.log('Navigating to:', href)}
        />
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">ResponsiveSidebar Demo</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Resize the window to see the sidebar adapt to different breakpoints:
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><strong>Mobile (≤767px):</strong> Overlay drawer mode</li>
              <li><strong>Tablet (768-1023px):</strong> Overlay drawer mode</li>
              <li><strong>Desktop (1024-1279px):</strong> Collapsible sidebar mode</li>
              <li><strong>Wide (≥1280px):</strong> Persistent sidebar mode</li>
            </ul>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default ResponsiveSidebarDemo