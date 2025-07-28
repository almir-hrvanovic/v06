// Main component exports
export { ResponsiveSidebar, default } from './index'

// Type exports
export type {
  ResponsiveSidebarProps,
  NavItem,
  SidebarMode,
  Breakpoints,
  LayoutVariant,
  AnimationConfig,
  ThemeConfig,
  SidebarState,
  NavGroup,
  SidebarConfig,
  UseBreakpointReturn,
  UseSidebarReturn,
  NavigationEventHandler,
  SearchEventHandler,
  StateChangeHandler
} from './types'

// Hook exports
export {
  useBreakpoint,
  useResponsiveSidebar,
  useNavigationSearch,
  useActiveNavigation,
  useKeyboardNavigation,
  useSidebarAnimation
} from './hooks'

// Utility exports
export {
  defaultBreakpoints,
  defaultModeMap,
  defaultAnimationConfig,
  defaultThemeConfig,
  filterNavItemsByRole,
  filterNavGroupsByRole,
  getCurrentBreakpoint,
  getSidebarMode,
  searchNavItems,
  findNavItemByHref,
  getNavBreadcrumbs,
  flattenNavItems,
  groupNavItems,
  sortNavItems,
  validateNavStructure,
  persistSidebarState,
  restoreSidebarState,
  debounce,
  throttle,
  createResponsiveClasses,
  getResponsiveValue
} from './utils'

// Navigation exports
export {
  defaultNavItems,
  extendedNavItems,
  navGroups,
  minimalNavItems,
  adminNavItems
} from './navigation'

// Integration examples (optional)
export {
  IntegratedLayout,
  GradualMigrationLayout,
  CustomThemedLayout
} from './integration-example'

// Demo component (optional)
export { ResponsiveSidebarDemo } from './demo'