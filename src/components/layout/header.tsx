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
    
    try {
      // Update user preference in the database
      await fetch('/api/users/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: locale })
      })
      
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
      className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6"
      role="banner"
      aria-label="Application header with search and user menu"
    >
      <div className="flex items-center space-x-4">
        {/* Search Form */}
        <form className="relative max-w-md" onSubmit={handleSearchSubmit} role="search">
          <label 
            id={searchLabelId}
            htmlFor={searchId}
            className="sr-only"
          >
            {t('search')} the application
          </label>
          <Search 
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" 
            aria-hidden="true"
          />
          <Input
            id={searchId}
            ref={searchInputRef}
            type="search"
            placeholder={t('search')}
            className="pl-10 w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-labelledby={searchLabelId}
            aria-describedby={`${searchId}-desc`}
            {...searchKeyboard.elementRef && { ref: searchKeyboard.elementRef }}
          />
          <div id={`${searchId}-desc`} className="sr-only">
            Press Enter to search, Escape to clear
          </div>
        </form>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              ref={userMenuButtonRef}
              variant="ghost" 
              className="flex items-center space-x-2"
              {...userMenuKeyboard.elementRef && { ref: userMenuKeyboard.elementRef }}
              {...ariaProps.button({
                hasPopup: 'menu',
                expanded: false,
                controls: userMenuId,
                labelledBy: userMenuLabelId
              })}
              aria-label={`User menu for ${session?.user?.name || 'User'}`}
            >
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
                aria-hidden="true"
              >
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">
                  {session?.user?.name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {session?.user?.email}
                </div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                  {session?.user?.role ? tRoles(session.user.role.toLowerCase()) : ''}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            id={userMenuId}
            align="end" 
            className="w-56"
            role="menu"
            aria-labelledby={userMenuLabelId}
          >
            <DropdownMenuLabel id={userMenuLabelId}>
              {t('myAccount')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem role="menuitem">
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('profile')}
            </DropdownMenuItem>
            
            {/* Theme Toggle Inline */}
            <div className="px-2 py-1.5" role="menuitem">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">Theme</span>
                </div>
                <div className="ml-auto">
                  <ThemeToggleItems />
                </div>
              </div>
            </div>
            
            {/* Language Selector Inline */}
            <div className="px-2 py-1.5" role="group" aria-label="Language selection">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Languages className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">Language</span>
                </div>
              </div>
              <div className="mt-2 space-y-1" role="menu" aria-label="Available languages">
                <DropdownMenuItem
                  role="menuitem"
                  onClick={() => handleLanguageChange('hr-HR')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                  aria-label="Switch to Croatian language"
                >
                  <span aria-hidden="true">🇭🇷</span> Croatian
                </DropdownMenuItem>
                <DropdownMenuItem
                  role="menuitem"
                  onClick={() => handleLanguageChange('bs-BA')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                  aria-label="Switch to Bosnian language"
                >
                  <span aria-hidden="true">🇧🇦</span> Bosnian
                </DropdownMenuItem>
                <DropdownMenuItem
                  role="menuitem"
                  onClick={() => handleLanguageChange('en-US')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                  aria-label="Switch to English language"
                >
                  <span aria-hidden="true">🇺🇸</span> English
                </DropdownMenuItem>
                <DropdownMenuItem
                  role="menuitem"
                  onClick={() => handleLanguageChange('de-DE')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                  aria-label="Switch to German language"
                >
                  <span aria-hidden="true">🇩🇪</span> German
                </DropdownMenuItem>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              role="menuitem"
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
              aria-label="Sign out of your account"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('signOut')}
            </DropdownMenuItem>
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
    </header>
  )
}