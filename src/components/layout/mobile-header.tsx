'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { MobileBottomMenu } from './mobile-bottom-menu'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { QuickLanguageSwitcher } from '@/components/language/language-switcher'
import { useAuth } from '@/hooks/use-auth'
import {
  Search,
  User,
  LogOut,
  Plus,
  Languages,
  Palette,
} from 'lucide-react'
import { ThemeToggleItems } from '@/components/ui/theme-toggle'
import { useTranslations } from 'next-intl'

interface MobileHeaderProps {
  className?: string
}

export function MobileHeader({ className }: MobileHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const t = useTranslations('header')
  const tNav = useTranslations('navigation.main')
  const tRoles = useTranslations('roles')
  
  // Check if we're on a tablet/iPad size
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return false
  })
  
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLanguageChange = async (locale: string) => {
    setIsChangingLanguage(true)
    
    if (!user?.id) {
      console.error('No user session found')
      return
    }
    
    try {
      // Update user preference in the database
      const response = await fetch(`/api/users/${user.id}/language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: locale })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update language preference')
      }
      
      // Set cookie for immediate effect
      document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
      
      // Refresh the page to apply new language
      window.location.reload()
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChangingLanguage(false)
    }
  }

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
    const userRole = user?.role
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
    <header className={`mobile-header sticky top-0 z-40 w-full border-b bg-[hsl(var(--header-background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--header-background))]/80 ${className}`}>
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <svg width="20" height="20" viewBox="0 0 32 32" className="text-primary-foreground">
              <path d="M16 6l2.47 5.01L24 12.18l-4 3.9.94 5.5L16 19.15l-4.94 2.59.94-5.5-4-3.9 5.53-1.17L16 6z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <span className="font-semibold text-foreground text-lg">GS-Star</span>
            <div className="text-xs text-muted-foreground">v5.1</div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
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

          {/* Language Switcher */}
          <QuickLanguageSwitcher className="h-8 w-8" />
          
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu - Hidden on mobile, visible on tablets */}
          {isTablet && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-9 w-9 p-0 hover:bg-[hsl(var(--nav-hover))]"
                >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="sr-only">{t('userMenu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">{user?.role ? tRoles(user.role.toLowerCase()) : ''}</p>
              </div>
              <DropdownMenuSeparator />
              {/* Theme Toggle Inline */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Palette className="mr-2 h-4 w-4" />
                    <span className="text-sm">Theme</span>
                  </div>
                  <div className="ml-auto">
                    <ThemeToggleItems />
                  </div>
                </div>
              </div>
              
              {/* Language Selector Inline */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Languages className="mr-2 h-4 w-4" />
                    <span className="text-sm">Language</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => handleLanguageChange('hr-HR')}
                    disabled={isChangingLanguage}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors disabled:opacity-50"
                  >
                    🇭🇷 Croatian
                  </button>
                  <button
                    onClick={() => handleLanguageChange('bs-BA')}
                    disabled={isChangingLanguage}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors disabled:opacity-50"
                  >
                    🇧🇦 Bosnian
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en-US')}
                    disabled={isChangingLanguage}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors disabled:opacity-50"
                  >
                    🇺🇸 English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('de-DE')}
                    disabled={isChangingLanguage}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors disabled:opacity-50"
                  >
                    🇩🇪 German
                  </button>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          {/* Mobile Menu - Hamburger - Only on phones */}
          {!isTablet && <MobileBottomMenu />}
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