import { UserRole } from '@prisma/client'

// Navigation item interface
export interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
  children?: NavItem[]
  disabled?: boolean
}

// Responsive sidebar mode types
export type SidebarMode = 'overlay' | 'persistent' | 'collapsible' | 'hidden'

// Breakpoint definitions
export interface Breakpoints {
  mobile: number    // 0-767px
  tablet: number    // 768-1023px  
  desktop: number   // 1024-1279px
  wide: number      // 1280px+
}

// Layout variant types
export type LayoutVariant = 'default' | 'compact' | 'minimal' | 'full-height'

// Animation preferences
export interface AnimationConfig {
  duration: number
  easing: string
  stagger: boolean
  disabled: boolean
}

// Theme configuration
export interface ThemeConfig {
  customColors?: Record<string, string>
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  shadows?: boolean
  blur?: boolean
}

// Props interface for ResponsiveSidebar
export interface ResponsiveSidebarProps {
  className?: string
  breakpoints?: Partial<Breakpoints>
  navItems?: NavItem[]
  showLogo?: boolean
  logoComponent?: React.ReactNode
  onNavigate?: (href: string) => void
  enablePersistence?: boolean
  overlayBlur?: boolean
  customModeMap?: Partial<Record<keyof Breakpoints, SidebarMode>>
  variant?: LayoutVariant
  animation?: Partial<AnimationConfig>
  theme?: ThemeConfig
  collapsedWidth?: number
  expandedWidth?: number
  enableTooltips?: boolean
  showUserInfo?: boolean
  enableSearch?: boolean
  onSearch?: (query: string) => void
}

// Sidebar context interface
export interface SidebarState {
  isCollapsed: boolean
  isOpen: boolean
  currentMode: SidebarMode
  currentBreakpoint: keyof Breakpoints
  windowWidth: number
}

// Navigation group interface
export interface NavGroup {
  id: string
  title: string
  items: NavItem[]
  collapsed?: boolean
  roles?: UserRole[]
}

// Sidebar configuration interface
export interface SidebarConfig {
  breakpoints: Breakpoints
  modeMap: Record<keyof Breakpoints, SidebarMode>
  animation: AnimationConfig
  theme: ThemeConfig
  persistence: {
    enabled: boolean
    key: string
    expiry?: number
  }
}

// Hook return types
export interface UseBreakpointReturn {
  currentBreakpoint: keyof Breakpoints
  windowWidth: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
}

export interface UseSidebarReturn extends SidebarState {
  toggleCollapsed: () => void
  setIsCollapsed: (collapsed: boolean) => void
  toggleOpen: () => void
  setIsOpen: (open: boolean) => void
  reset: () => void
}

// Event handler types
export type NavigationEventHandler = (href: string, item: NavItem) => void
export type SearchEventHandler = (query: string, results: NavItem[]) => void
export type StateChangeHandler = (state: Partial<SidebarState>) => void