# Theme & Language Persistence - Quick Reference

## 🚀 Quick Start

### Using Theme
```typescript
import { useTheme } from '@/contexts/theme-context'

function MyComponent() {
  const { theme, setTheme, actualTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Current: {actualTheme}
    </button>
  )
}
```

### Using Language
```typescript
import { useLocale, useTranslations } from 'next-intl'
import { QuickLanguageSwitcher } from '@/components/language/language-switcher'

function MyComponent() {
  const locale = useLocale()
  const t = useTranslations('common')
  
  return (
    <div>
      <p>Current: {locale}</p>
      <p>{t('hello')}</p>
      <QuickLanguageSwitcher />
    </div>
  )
}
```

## 📝 Cheat Sheet

### Theme Values
```typescript
type Theme = 'light' | 'dark' | 'system'
```

### Language Codes
```typescript
const LOCALES = {
  'hr-HR': 'Croatian',
  'bs-BA': 'Bosnian', 
  'en-US': 'English',
  'de-DE': 'German'
}
```

### Storage Keys
```typescript
// Theme
localStorage['gs-cms-theme']

// Language  
document.cookie // 'locale=hr-HR'
user.preferredLanguage // Database
```

## 🔧 Components

### Language Switchers
```typescript
import { 
  LanguageSwitcher,       // Full dropdown
  QuickLanguageSwitcher,  // Globe icon
  InlineLanguageSwitcher, // Inline buttons
  LanguageSelector        // Simple select
} from '@/components/language/language-switcher'

// Usage
<QuickLanguageSwitcher className="h-8 w-8" />
```

### Theme Toggles
```typescript
import { 
  ThemeToggle,      // Full dropdown
  ThemeToggleItems  // Inline buttons
} from '@/components/ui/theme-toggle'

// Usage
<ThemeToggle />
```

## 🛠️ API Calls

### Update Language
```typescript
const response = await fetch('/api/user/language', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ language: 'hr-HR' })
})

if (response.ok) {
  // Update session
  await update({ preferredLanguage: 'hr-HR' })
  
  // Update cookie
  await setLocaleCookie('hr-HR')
  
  // Reload page
  window.location.reload()
}
```

### Get Current Language
```typescript
const response = await fetch('/api/user/language')
const data = await response.json()
console.log(data.preferredLanguage) // 'hr-HR'
```

## 🐛 Debug Tools

### Check Theme State
```typescript
const { theme, actualTheme } = useTheme()
console.log({
  contextTheme: theme,
  actualTheme,
  localStorage: localStorage.getItem('gs-cms-theme'),
  htmlClass: document.documentElement.className
})
```

### Check Language State
```typescript
const locale = useLocale()
const { data: session } = useSession()

console.log({
  nextIntl: locale,
  session: session?.user?.preferredLanguage,
  cookie: document.cookie.match(/locale=([^;]+)/)?.[1],
  html: document.documentElement.lang
})
```

## ⚡ Common Tasks

### Force Theme Change
```typescript
const { setTheme } = useTheme()
setTheme('dark') // Instant change
```

### Force Language Change
```typescript
import { setLocaleCookie } from '@/lib/locale'

// Method 1: Via API (recommended)
await fetch('/api/user/language', {
  method: 'PUT',
  body: JSON.stringify({ language: 'hr-HR' })
})

// Method 2: Direct cookie (temporary)
await setLocaleCookie('hr-HR')
window.location.reload()
```

### Check if User is Authenticated
```typescript
const { data: session, status } = useSession()

if (status === 'authenticated') {
  // User can change preferences
}
```

## 🚨 Troubleshooting

### Theme Not Persisting
```typescript
// Check localStorage
console.log(localStorage.getItem('gs-cms-theme'))

// Check initialization
console.log(document.documentElement.classList.contains('dark'))

// Manual fix
localStorage.setItem('gs-cms-theme', 'dark')
location.reload()
```

### Language Not Persisting
```typescript
// Check cookie
console.log(document.cookie.includes('locale='))

// Check database
const res = await fetch('/api/user/language')
console.log(await res.json())

// Manual fix
document.cookie = 'locale=hr-HR; path=/; max-age=31536000'
location.reload()
```

### Hydration Warnings
```typescript
// Add to problematic components
<div suppressHydrationWarning>
  {dynamicContent}
</div>
```

## 📊 File Locations

```
src/
├── app/layout.tsx                    # 🏠 Main initialization
├── contexts/theme-context.tsx        # 🎨 Theme state
├── components/language/              # 🌍 Language UI
├── components/ui/theme-toggle.tsx    # 🎨 Theme UI
├── lib/locale.ts                     # 🌍 Language utils
└── app/api/user/language/route.ts    # 🌍 Language API
```

## 💡 Best Practices

### ✅ Do
- Use provided components for UI
- Update database first, then cookie
- Handle errors gracefully
- Test across browser restarts

### ❌ Don't
- Manually manipulate DOM classes
- Skip database updates
- Ignore hydration warnings
- Hardcode language strings

## 🔄 Update Process

### Theme Change Flow
```
User Click → setTheme() → localStorage → DOM class → UI Update
```

### Language Change Flow
```
User Click → API Call → Database → Session → Cookie → Page Reload → UI Update
```

---

**Need help?** Check the full documentation at `/docs/persistence-system.md`