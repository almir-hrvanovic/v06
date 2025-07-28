'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('theme')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-[hsl(var(--nav-hover))] text-muted-foreground hover:text-foreground">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4 text-orange-500" />
          <span>{t('light')}</span>
          {theme === 'light' && <span className="ml-auto text-[hsl(var(--supabase-green))]">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4 text-blue-500" />
          <span>{t('dark')}</span>
          {theme === 'dark' && <span className="ml-auto text-[hsl(var(--supabase-green))]">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4 text-gray-500" />
          <span>{t('system')}</span>
          {theme === 'system' && <span className="ml-auto text-[hsl(var(--supabase-green))]">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Theme toggle items for use within other dropdown menus
export function ThemeToggleItems() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('theme')

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        className="h-7 w-7 p-0"
        title={t('light')}
      >
        <Sun className="h-3 w-3" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('dark')}
        className="h-7 w-7 p-0"
        title={t('dark')}
      >
        <Moon className="h-3 w-3" />
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('system')}
        className="h-7 w-7 p-0"
        title={t('system')}
      >
        <Monitor className="h-3 w-3" />
      </Button>
    </div>
  )
}