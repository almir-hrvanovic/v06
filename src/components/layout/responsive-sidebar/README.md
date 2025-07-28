# ResponsiveSidebar Component

A comprehensive, responsive sidebar component that adapts to different screen sizes and provides seamless navigation across breakpoints.

## Features

- **Responsive Design**: Automatically adapts between overlay, collapsible, and persistent modes based on screen size
- **Role-based Navigation**: Filters navigation items based on user roles
- **Smooth Transitions**: CSS-based animations with customizable timing and easing
- **Theme Integration**: Full integration with existing CSS variables and dark mode
- **Persistence**: Optional localStorage persistence for sidebar state
- **Accessibility**: Full keyboard navigation and screen reader support
- **TypeScript**: Complete type safety with comprehensive interfaces

## Architecture

### Breakpoint System

```typescript
interface Breakpoints {
  mobile: number    // 0-767px (overlay mode)
  tablet: number    // 768-1023px (overlay mode)  
  desktop: number   // 1024-1279px (collapsible mode)
  wide: number      // 1280px+ (persistent mode)
}
```

### Sidebar Modes

- **`overlay`**: Drawer that slides in from the left (mobile/tablet)
- **`persistent`**: Always visible sidebar (wide screens)
- **`collapsible`**: Can be collapsed to icon-only view (desktop)
- **`hidden`**: Completely hidden (custom scenarios)

## Basic Usage

```tsx
import { ResponsiveSidebar } from '@/components/layout/responsive-sidebar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
```

## Advanced Configuration

```tsx
import { ResponsiveSidebar } from '@/components/layout/responsive-sidebar'
import { customNavItems } from './navigation'

export function CustomLayout() {
  const handleNavigate = (href: string) => {
    console.log('Navigating to:', href)
  }

  return (
    <ResponsiveSidebar
      navItems={customNavItems}
      breakpoints={{
        mobile: 600,
        tablet: 900,
        desktop: 1200,
        wide: 1400
      }}
      customModeMap={{
        mobile: 'overlay',
        tablet: 'collapsible',
        desktop: 'persistent',
        wide: 'persistent'
      }}
      showLogo={true}
      enablePersistence={true}
      overlayBlur={true}
      onNavigate={handleNavigate}
      className="custom-sidebar"
    />
  )
}
```

## Custom Logo Component

```tsx
import { Database } from 'lucide-react'

const CustomLogo = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="flex h-16 items-center px-4">
    <div className="flex items-center space-x-3">
      <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
        <Database className="h-5 w-5 text-primary-foreground" />
      </div>
      {!isCollapsed && (
        <span className="font-bold text-lg">My App</span>
      )}
    </div>
  </div>
)

<ResponsiveSidebar logoComponent={<CustomLogo />} />
```

## Navigation Structure

### Basic Navigation Item

```typescript
interface NavItem {
  titleKey: string                              // i18n translation key
  href: string                                 // Route path
  icon: React.ComponentType<{ className?: string }>  // Lucide icon
  roles: UserRole[]                           // Required user roles
  badge?: number                              // Optional badge count
  children?: NavItem[]                        // Nested navigation
  disabled?: boolean                          // Disable item
}
```

### Example Navigation

```typescript
const navItems: NavItem[] = [
  {
    titleKey: 'navigation.main.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'USER'],
  },
  {
    titleKey: 'navigation.main.users',
    href: '/dashboard/users',
    icon: Users,
    roles: ['ADMIN'],
    children: [
      {
        titleKey: 'navigation.users.list',
        href: '/dashboard/users',
        icon: UserList,
        roles: ['ADMIN'],
      },
      {
        titleKey: 'navigation.users.roles',
        href: '/dashboard/users/roles',
        icon: Shield,
        roles: ['ADMIN'],
      }
    ]
  }
]
```

## Hooks

### useBreakpoint

```typescript
const { currentBreakpoint, isMobile, isTablet, isDesktop, isWide } = useBreakpoint(breakpoints)
```

### useResponsiveSidebar

```typescript
const {
  isCollapsed,
  isOpen,
  currentMode,
  toggleCollapsed,
  setIsCollapsed,
  toggleOpen,
  setIsOpen,
  reset
} = useResponsiveSidebar(breakpoints, modeMap, {
  enablePersistence: true,
  persistenceKey: 'my-sidebar-state'
})
```

### useNavigationSearch

```typescript
const {
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  clearSearch,
  hasResults
} = useNavigationSearch(navItems, 300)
```

## Styling

The component uses CSS variables for theming and integrates with your existing design system:

```css
:root {
  --sidebar-background: 240 6% 97%;
  --sidebar-foreground: 240 8% 15%;
  --sidebar-border: 240 6% 90%;
  --sidebar-active: 151 60% 45%;
  --sidebar-hover: 240 5% 92%;
  --sidebar-icon: 240 6% 46%;
  /* ... more variables */
}
```

### Custom CSS Classes

```css
.sidebar-nav {
  /* Custom sidebar container styles */
}

.sidebar-nav-item {
  /* Custom navigation item styles */
}

.sidebar-nav-item-active {
  /* Custom active item styles */
}
```

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- ARIA labels and descriptions
- Focus management
- High contrast mode support

### Keyboard Shortcuts

- `Tab` / `Shift+Tab`: Navigate between items
- `Arrow Up/Down`: Navigate within sidebar
- `Enter` / `Space`: Activate item
- `Escape`: Close overlay sidebar

## Performance

- Lazy loading of non-critical features
- Optimized re-renders with React.memo
- Efficient event handling with debouncing
- CSS-based animations for smooth transitions

## Integration Examples

### With Next.js App Router

```tsx
// app/layout.tsx
import { ResponsiveSidebar } from '@/components/layout/responsive-sidebar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen">
          <ResponsiveSidebar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
```

### With Authentication

```tsx
import { useSession } from 'next-auth/react'
import { ResponsiveSidebar } from '@/components/layout/responsive-sidebar'

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  
  if (!session) return <div>Please sign in</div>
  
  return (
    <div className="flex h-screen">
      <ResponsiveSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
```

## Migration from Existing Sidebars

### From Separate Mobile/Desktop Components

Replace your existing sidebar components:

```tsx
// Before
<div className="hidden lg:block">
  <DesktopSidebar />
</div>
<div className="lg:hidden">
  <MobileSidebar />
</div>

// After
<ResponsiveSidebar />
```

### Gradual Migration

You can gradually migrate by using the ResponsiveSidebar alongside existing components:

```tsx
// Transition period
<div className="hidden xl:block">
  <ResponsiveSidebar />
</div>
<div className="xl:hidden">
  <LegacySidebar />
</div>
```

## Troubleshooting

### Common Issues

1. **Sidebar not appearing**: Check that `SidebarProvider` is in your component tree
2. **Navigation not filtered**: Ensure user role is available in session
3. **Styling issues**: Verify CSS variables are defined in your theme
4. **Animation glitches**: Check for conflicting CSS transitions

### Debug Mode

```tsx
<ResponsiveSidebar 
  onNavigate={(href) => console.log('Navigate:', href)}
  // Add other debug props
/>
```

## Contributing

When extending the component:

1. Maintain TypeScript type safety
2. Follow existing naming conventions
3. Add comprehensive tests
4. Update documentation
5. Consider accessibility implications
6. Test across all breakpoints

## License

This component is part of the GS-CMS project and follows the project's licensing terms.