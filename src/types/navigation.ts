import { UserRole } from '@prisma/client'
import { LucideIcon } from 'lucide-react'

export interface NavItem {
  titleKey: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  badge?: number
}

export interface NavGroup {
  id: string
  titleKey: string
  icon: LucideIcon
  items: NavItem[]
  roles: UserRole[]
  priority: number
}

export interface NavigationState {
  activeGroup: string | null
  isOpen: boolean
  searchQuery: string
}