'use client'

import { Bell, Search, User, LogOut, Settings, Languages, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { ThemeToggleItems } from '@/components/ui/theme-toggle'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/sidebar-context'
import { useA11yKeyboardNav, useA11yId } from '@/hooks/use-accessibility'
import { KEYBOARD_KEYS, ariaProps } from '@/lib/accessibility'

export function Header() {
  const { data: session } = useSession()
  const t = useTranslations('header')
  const tRoles = useTranslations('roles')
  const router = useRouter()
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Accessibility context
  const { accessibility, announceStateChange } = useSidebar()
  
  // Accessibility IDs
  const headerId = useA11yId('header')
  const searchId = useA11yId('search')
  const searchLabelId = useA11yId('search-label')
  const userMenuId = useA11yId('user-menu')
  const userMenuLabelId = useA11yId('user-menu-label')
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const userMenuButtonRef = useRef<HTMLButtonElement>(null)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const handleLanguageChange = async (locale: string) => {
    setIsChangingLanguage(true)
    
    // Announce language change
    if (accessibility.announceStateChanges) {
      announceStateChange('Language', `changing to ${locale}`)
    }
    
    if (!session?.user?.id) {
      console.error('No user session found')
      return
    }
    
    try {
      // Update user preference in the database
      const response = await fetch(`/api/users/${session.user.id}/language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: locale })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update language preference')
      }
      
      // Set cookie for immediate effect
      document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
      
      // Announce success before reload
      if (accessibility.announceStateChanges) {
        announceStateChange('Language', `changed to ${locale}, reloading page`)
      }
      
      // Refresh the page to apply new language
      window.location.reload()
    } catch (error) {
      console.error('Failed to change language:', error)
      
      if (accessibility.announceStateChanges) {
        announceStateChange('Language change', 'failed, please try again')
      }
    } finally {
      setIsChangingLanguage(false)
    }
  }

  // Search handling
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      
      if (accessibility.announceStateChanges) {
        announceStateChange('Search', `searching for ${searchQuery.trim()}`)
      }
    }
  }

  // Keyboard navigation for search
  const searchKeyboard = useA11yKeyboardNav({
    onEscape: () => {
      setSearchQuery('')
      searchInputRef.current?.blur()
    },
    onEnter: () => {
      handleSearchSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  })

  // Keyboard navigation for user menu
  const userMenuKeyboard = useA11yKeyboardNav({
    onArrowDown: () => {
      // Focus first menu item when menu opens
      setTimeout(() => {
        const firstMenuItem = document.querySelector('[role="menu"] [role="menuitem"]') as HTMLElement
        if (firstMenuItem) {
          firstMenuItem.focus()
        }
      }, 100)
    }
  })

  return (
    <header 
      id={headerId}
      className="sticky top-0 z-50 h-16 bg-[hsl(var(--header-background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--header-background))]/80 border-b border-border"
      role="banner"
      aria-label="Application header with search and user menu"
    >
      <div className="h-full flex items-center px-6">
        {/* Left spacer */}
        <div className="flex-1" />
        
        {/* Search Form - Centered */}
        <div className="w-full max-w-2xl px-8">
          <form className="relative w-full" onSubmit={handleSearchSubmit} role="search">
            <label 
              id={searchLabelId}
              htmlFor={searchId}
              className="sr-only"
            >
              {t('search')} the application
            </label>
            <Search 
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" 
              aria-hidden="true"
            />
            <Input
              id={searchId}
              ref={searchInputRef}
              type="search"
              placeholder={t('search')}
              className="pl-10 w-full h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-labelledby={searchLabelId}
              aria-describedby={`${searchId}-desc`}
            />
            <div id={`${searchId}-desc`} className="sr-only">
              Press Enter to search, Escape to clear
            </div>
          </form>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex-1 flex items-center justify-end space-x-3">
          {/* Notifications with modern styling */}
          <div className="relative">
            <NotificationDropdown />
          </div>

          {/* Professional User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                ref={userMenuButtonRef}
                variant="ghost" 
                className="relative flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                aria-haspopup="menu"
                aria-expanded={false}
                aria-controls={userMenuId}
                aria-labelledby={userMenuLabelId}
                aria-label={`User menu for ${session?.user?.name || 'User'}`}
              >
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  aria-hidden="true"
                >
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-foreground">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session?.user?.role ? tRoles(session.user.role.toLowerCase()) : ''}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              id={userMenuId}
              align="end" 
              className="w-64 mt-2"
              role="menu"
              aria-labelledby={userMenuLabelId}
            >
              {/* User Info Section */}
              <div className="px-4 py-3 border-b">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {session?.user?.name || 'User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session?.user?.email || ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className="py-2">
                <DropdownMenuItem role="menuitem" className="px-4 py-2" asChild>
                  <Link href="/dashboard/settings?tab=profile">
                    <User className="mr-3 h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">{t('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem role="menuitem" className="px-4 py-2" asChild>
                  <Link href="/dashboard/settings?tab=notifications">
                    <Settings className="mr-3 h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator />

              {/* Preferences */}
              <div className="py-2">
                {/* Theme Selector */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-4 py-2">
                    <Palette className="mr-3 h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Theme</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <ThemeToggleItems />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Language Selector */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="px-4 py-2">
                    <Languages className="mr-3 h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Language</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      role="menuitem"
                      onClick={() => handleLanguageChange('en-US')}
                      disabled={isChangingLanguage}
                      className="cursor-pointer"
                    >
                      <span className="mr-2">🇺🇸</span> English
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      role="menuitem"
                      onClick={() => handleLanguageChange('hr-HR')}
                      disabled={isChangingLanguage}
                      className="cursor-pointer"
                    >
                      <span className="mr-2">🇭🇷</span> Croatian
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      role="menuitem"
                      onClick={() => handleLanguageChange('bs-BA')}
                      disabled={isChangingLanguage}
                      className="cursor-pointer"
                    >
                      <span className="mr-2">🇧🇦</span> Bosnian
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      role="menuitem"
                      onClick={() => handleLanguageChange('de-DE')}
                      disabled={isChangingLanguage}
                      className="cursor-pointer"
                    >
                      <span className="mr-2">🇩🇪</span> German
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </div>

              <DropdownMenuSeparator />

              {/* Sign Out */}
              <div className="py-2">
                <DropdownMenuItem 
                  role="menuitem"
                  onClick={handleSignOut}
                  className="px-4 py-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-3 h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">{t('signOut')}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Live region for announcements */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            id={`${headerId}-announcements`}
          />
        </div>
      </div>
    </header>
  )
}