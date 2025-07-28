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
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function Header() {
  const { data: session } = useSession()
  const t = useTranslations('header')
  const tRoles = useTranslations('roles')
  const router = useRouter()
  const [isChangingLanguage, setIsChangingLanguage] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const handleLanguageChange = async (locale: string) => {
    setIsChangingLanguage(true)
    try {
      // Update user preference in the database
      await fetch('/api/users/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: locale })
      })
      
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

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6">
      <div className="flex items-center space-x-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('search')}
            className="pl-10 w-80"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationDropdown />


        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t('profile')}
            </DropdownMenuItem>
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
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('hr-HR')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                >
                  🇭🇷 Croatian
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('bs-BA')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                >
                  🇧🇦 Bosnian
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('en-US')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                >
                  🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('de-DE')}
                  disabled={isChangingLanguage}
                  className="cursor-pointer px-2 py-1.5 text-xs"
                >
                  🇩🇪 German
                </DropdownMenuItem>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}