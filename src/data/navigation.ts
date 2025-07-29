import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Calculator,
  CheckSquare,
  FileCheck,
  Package,
  BarChart3,
  Search,
  FileBarChart,
  Workflow,
  Building2,
  TrendingUp,
  Settings,
  ClipboardList
} from 'lucide-react'
import { NavGroup } from '@/types/navigation'

export const navigationGroups: NavGroup[] = [
  {
    id: 'core',
    titleKey: 'navigation.groups.core',
    icon: LayoutDashboard,
    priority: 1,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
    items: [
      {
        titleKey: 'navigation.main.dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
      },
      {
        titleKey: 'navigation.main.search',
        href: '/dashboard/search',
        icon: Search,
        roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
      }
    ]
  },
  {
    id: 'management',
    titleKey: 'navigation.groups.management',
    icon: Users,
    priority: 2,
    roles: ['SUPERUSER', 'ADMIN', 'SALES'],
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
      }
    ]
  },
  {
    id: 'operations',
    titleKey: 'navigation.groups.operations',
    icon: Building2,
    priority: 3,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'VPP', 'VP'],
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
      }
    ]
  },
  {
    id: 'analytics',
    titleKey: 'navigation.groups.analytics',
    icon: TrendingUp,
    priority: 4,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
    items: [
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
      }
    ]
  },
  {
    id: 'system',
    titleKey: 'navigation.groups.system',
    icon: Settings,
    priority: 5,
    roles: ['SUPERUSER', 'ADMIN'],
    items: [
      {
        titleKey: 'navigation.main.automation',
        href: '/dashboard/automation',
        icon: Workflow,
        roles: ['SUPERUSER', 'ADMIN'],
      }
    ]
  }
]