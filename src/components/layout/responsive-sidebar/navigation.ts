import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Calculator,
  CheckSquare,
  FileCheck,
  Package,
  Settings,
  BarChart3,
  Search,
  FileBarChart,
  Workflow,
  Database,
  Shield,
  Bell,
  Calendar,
  Clock,
  Filter,
  PieChart,
  TrendingUp,
  Archive,
  Tag,
  Globe,
  Mail,
  Phone,
  MapPin,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  UserPlus,
  UserMinus,
  Users2,
  Building,
  Factory,
  ClipboardList,
} from 'lucide-react'
import { NavItem, NavGroup } from './types'

// Main navigation items - matches existing structure
export const defaultNavItems: NavItem[] = [
  {
    titleKey: 'navigation.main.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    titleKey: 'navigation.main.customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['SUPERUSER', 'ADMIN', 'SALES'],
  },
  {
    titleKey: 'navigation.main.users',
    href: '/dashboard/users',
    icon: UserCheck,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    titleKey: 'navigation.main.inquiries',
    href: '/dashboard/inquiries',
    icon: FileText,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
  },
  {
    titleKey: 'navigation.main.search',
    href: '/dashboard/search',
    icon: Search,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    titleKey: 'navigation.main.assignments',
    href: '/dashboard/assignments/unified',
    icon: ClipboardList,
    roles: ['SUPERUSER', 'ADMIN', 'VPP'],
  },
  {
    titleKey: 'navigation.main.costs',
    href: '/dashboard/costs',
    icon: Calculator,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'VP'],
  },
  {
    titleKey: 'navigation.main.approvals',
    href: '/dashboard/approvals',
    icon: CheckSquare,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.quotes',
    href: '/dashboard/quotes',
    icon: FileCheck,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'],
  },
  {
    titleKey: 'navigation.main.production',
    href: '/dashboard/production',
    icon: Package,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.reports',
    href: '/dashboard/reports',
    icon: FileBarChart,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.automation',
    href: '/dashboard/automation',
    icon: Workflow,
    roles: ['SUPERUSER', 'ADMIN'],
  },
]

// Extended navigation with hierarchical structure
export const extendedNavItems: NavItem[] = [
  {
    titleKey: 'navigation.main.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    titleKey: 'navigation.main.customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['SUPERUSER', 'ADMIN', 'SALES'],
    children: [
      {
        titleKey: 'navigation.customers.list',
        href: '/dashboard/customers',
        icon: Users2,
        roles: ['SUPERUSER', 'ADMIN', 'SALES'],
      },
      {
        titleKey: 'navigation.customers.add',
        href: '/dashboard/customers/add',
        icon: UserPlus,
        roles: ['SUPERUSER', 'ADMIN', 'SALES'],
      },
      {
        titleKey: 'navigation.customers.companies',
        href: '/dashboard/customers/companies',
        icon: Building,
        roles: ['SUPERUSER', 'ADMIN', 'SALES'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.users',
    href: '/dashboard/users',
    icon: UserCheck,
    roles: ['SUPERUSER', 'ADMIN'],
    children: [
      {
        titleKey: 'navigation.users.list',
        href: '/dashboard/users',
        icon: Users,
        roles: ['SUPERUSER', 'ADMIN'],
      },
      {
        titleKey: 'navigation.users.roles',
        href: '/dashboard/users/roles',
        icon: Shield,
        roles: ['SUPERUSER', 'ADMIN'],
      },
      {
        titleKey: 'navigation.users.permissions',
        href: '/dashboard/users/permissions',
        icon: Key,
        roles: ['SUPERUSER'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.inquiries',
    href: '/dashboard/inquiries',
    icon: FileText,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
    children: [
      {
        titleKey: 'navigation.inquiries.active',
        href: '/dashboard/inquiries/active',
        icon: Clock,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
      },
      {
        titleKey: 'navigation.inquiries.pending',
        href: '/dashboard/inquiries/pending',
        icon: Bell,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
      },
      {
        titleKey: 'navigation.inquiries.archived',
        href: '/dashboard/inquiries/archived',
        icon: Archive,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.search',
    href: '/dashboard/search',
    icon: Search,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
    children: [
      {
        titleKey: 'navigation.search.advanced',
        href: '/dashboard/search/advanced',
        icon: Filter,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
      },
      {
        titleKey: 'navigation.search.saved',
        href: '/dashboard/search/saved',
        icon: Tag,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.assignments',
    href: '/dashboard/assignments/unified',
    icon: ClipboardList,
    roles: ['SUPERUSER', 'ADMIN', 'VPP'],
  },
  {
    titleKey: 'navigation.main.costs',
    href: '/dashboard/costs',
    icon: Calculator,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'VP'],
  },
  {
    titleKey: 'navigation.main.approvals',
    href: '/dashboard/approvals',
    icon: CheckSquare,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.quotes',
    href: '/dashboard/quotes',
    icon: FileCheck,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'],
  },
  {
    titleKey: 'navigation.main.production',
    href: '/dashboard/production',
    icon: Package,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
    children: [
      {
        titleKey: 'navigation.production.schedule',
        href: '/dashboard/production/schedule',
        icon: Calendar,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
      {
        titleKey: 'navigation.production.capacity',
        href: '/dashboard/production/capacity',
        icon: Factory,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
    children: [
      {
        titleKey: 'navigation.analytics.overview',
        href: '/dashboard/analytics',
        icon: PieChart,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
      {
        titleKey: 'navigation.analytics.trends',
        href: '/dashboard/analytics/trends',
        icon: TrendingUp,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.reports',
    href: '/dashboard/reports',
    icon: FileBarChart,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
    children: [
      {
        titleKey: 'navigation.reports.generate',
        href: '/dashboard/reports/generate',
        icon: Plus,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
      {
        titleKey: 'navigation.reports.scheduled',
        href: '/dashboard/reports/scheduled',
        icon: Clock,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
      {
        titleKey: 'navigation.reports.export',
        href: '/dashboard/reports/export',
        icon: Download,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
    ]
  },
  {
    titleKey: 'navigation.main.automation',
    href: '/dashboard/automation',
    icon: Workflow,
    roles: ['SUPERUSER', 'ADMIN'],
    children: [
      {
        titleKey: 'navigation.automation.rules',
        href: '/dashboard/automation/rules',
        icon: Settings,
        roles: ['SUPERUSER', 'ADMIN'],
      },
      {
        titleKey: 'navigation.automation.triggers',
        href: '/dashboard/automation/triggers',
        icon: RefreshCw,
        roles: ['SUPERUSER', 'ADMIN'],
      },
    ]
  },
]

// Navigation groups for better organization
export const navGroups: NavGroup[] = [
  {
    id: 'main',
    title: 'navigation.groups.main',
    items: [
      {
        titleKey: 'navigation.main.dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
      },
    ],
  },
  {
    id: 'management',
    title: 'navigation.groups.management',
    items: [
      {
        titleKey: 'navigation.main.customers',
        href: '/dashboard/customers',
        icon: Users,
        roles: ['SUPERUSER', 'ADMIN', 'SALES'],
      },
      {
        titleKey: 'navigation.main.users',
        href: '/dashboard/users',
        icon: UserCheck,
        roles: ['SUPERUSER', 'ADMIN'],
      },
      {
        titleKey: 'navigation.main.inquiries',
        href: '/dashboard/inquiries',
        icon: FileText,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
      },
    ],
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'],
  },
  {
    id: 'operations',
    title: 'navigation.groups.operations',
    items: [
      {
        titleKey: 'navigation.main.assignments',
        href: '/dashboard/assignments',
        icon: ClipboardList,
        roles: ['SUPERUSER', 'ADMIN', 'VPP'],
      },
      {
        titleKey: 'navigation.main.costs',
        href: '/dashboard/costs',
        icon: Calculator,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'VP'],
      },
      {
        titleKey: 'navigation.main.approvals',
        href: '/dashboard/approvals',
        icon: CheckSquare,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
      {
        titleKey: 'navigation.main.quotes',
        href: '/dashboard/quotes',
        icon: FileCheck,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'],
      },
      {
        titleKey: 'navigation.main.production',
        href: '/dashboard/production',
        icon: Package,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
    ],
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
  },
  {
    id: 'insights',
    title: 'navigation.groups.insights',
    items: [
      {
        titleKey: 'navigation.main.search',
        href: '/dashboard/search',
        icon: Search,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
      },
      {
        titleKey: 'navigation.main.analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
      {
        titleKey: 'navigation.main.reports',
        href: '/dashboard/reports',
        icon: FileBarChart,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
      },
    ],
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    id: 'system',
    title: 'navigation.groups.system',
    items: [
      {
        titleKey: 'navigation.main.automation',
        href: '/dashboard/automation',
        icon: Workflow,
        roles: ['SUPERUSER', 'ADMIN'],
      },
    ],
    roles: ['SUPERUSER', 'ADMIN'],
  },
]

// Minimal navigation for compact layouts
export const minimalNavItems: NavItem[] = [
  {
    titleKey: 'navigation.main.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    titleKey: 'navigation.main.customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['SUPERUSER', 'ADMIN', 'SALES'],
  },
  {
    titleKey: 'navigation.main.inquiries',
    href: '/dashboard/inquiries',
    icon: FileText,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
  },
  {
    titleKey: 'navigation.main.search',
    href: '/dashboard/search',
    icon: Search,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
]

// Admin-only navigation items
export const adminNavItems: NavItem[] = [
  {
    titleKey: 'navigation.admin.users',
    href: '/dashboard/admin/users',
    icon: UserCheck,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    titleKey: 'navigation.admin.settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    titleKey: 'navigation.admin.automation',
    href: '/dashboard/admin/automation',
    icon: Workflow,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    titleKey: 'navigation.admin.logs',
    href: '/dashboard/admin/logs',
    icon: FileText,
    roles: ['SUPERUSER'],
  },
]