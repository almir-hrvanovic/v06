'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MobileSidebar } from './mobile-sidebar'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { useSession, signOut } from 'next-auth/react'
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Plus,
  Filter,
  Languages,
} from 'lucide-react'
import { LanguageSelector } from '@/components/ui/language-selector'
import { useTranslations } from 'next-intl'

interface MobileHeaderProps {
  className?: string
}

export function MobileHeader({ className }: MobileHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const t = useTranslations('header')
  const tNav = useTranslations('navigation.main')

  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    if (pathname === '/dashboard') return tNav('dashboard')
    if (pathname === '/dashboard/inquiries') return tNav('inquiries')
    if (pathname === '/dashboard/search') return tNav('search')
    if (pathname === '/dashboard/reports') return tNav('reports')
    if (pathname === '/dashboard/analytics') return tNav('analytics')
    if (pathname.includes('/inquiries/')) return t('inquiryDetails')
    
    return lastSegment?.charAt(0).toUpperCase() + lastSegment?.slice(1) || tNav('dashboard')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const getQuickActions = () => {
    const userRole = session?.user?.role
    const actions = []

    // Add quick actions based on current page and user role
    if (pathname === '/dashboard/inquiries' && ['SALES', 'ADMIN', 'SUPERUSER'].includes(userRole || '')) {
      actions.push({
        label: t('newInquiry'),
        href: '/dashboard/inquiries/new',
        icon: Plus
      })
    }

    return actions
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-[hsl(var(--header-background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--header-background))]/80 ${className}`}>
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-4">
          <div className="md:hidden">
            <MobileSidebar />
          </div>
          <div className="hidden lg:flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--supabase-green))] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">GS</span>
            </div>
            <div>
              <span className="font-semibold text-foreground text-lg">GS-CMS</span>
              <div className="text-xs text-muted-foreground">v5.0</div>
            </div>
          </div>
          <div className="lg:hidden flex flex-col">
            <h1 className="text-lg font-semibold truncate text-foreground">{getPageTitle()}</h1>
            {session?.user?.name && (
              <p className="text-xs text-muted-foreground truncate">
                {t('welcome')}, {session.user.name.split(' ')[0]}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="ml-auto flex items-center space-x-3">
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-[hsl(var(--nav-hover))] text-muted-foreground hover:text-foreground"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">{t('toggleSearch')}</span>
          </Button>

          {/* Language Selector */}
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-[hsl(var(--nav-hover))]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--supabase-green))] text-white text-sm font-medium shadow-sm">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="sr-only">{t('userMenu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {showSearch && (
        <div className="border-t bg-background px-4 py-3">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Quick Actions Bar */}
      {getQuickActions().length > 0 && (
        <div className="border-t bg-muted/30 px-4 py-2">
          <div className="flex space-x-2">
            {getQuickActions().map((action, index) => (
              <Button key={index} variant="outline" size="sm" asChild>
                <Link href={action.href}>
                  <action.icon className="mr-2 h-3 w-3" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}