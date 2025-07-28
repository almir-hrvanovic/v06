# Developer i18n Guide - GS-CMS Enterprise

Complete guide for developers working with internationalization in the GS-CMS project.

## 🚀 Quick Start

### Basic Translation Usage

```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('common.actions')
  
  return (
    <button>{t('save')}</button>
    // Renders: "Save" (en), "Spremi" (hr), "Spremi" (bs), "Speichern" (de)
  )
}
```

### Namespaced Translations

```typescript
import { useTranslations } from 'next-intl'

function UserForm() {
  const t = useTranslations('forms.validation')
  
  return (
    <div>
      {error && <span>{t('required')}</span>}
      {/* Renders: "This field is required" / "Ovo polje je obavezno" */}
    </div>
  )
}
```

## 📁 Project Structure

```
messages/
├── en.json          # English (base language)
├── hr.json          # Croatian  
├── bs.json          # Bosnian
└── de.json          # German

src/
├── components/
│   └── language/
│       ├── language-switcher.tsx
│       └── locale-provider.tsx
├── hooks/
│   ├── use-pluralization.ts
│   └── use-locale-format.ts
├── lib/
│   ├── locale.ts
│   └── auth.ts
└── i18n/
    ├── request.ts
    └── routing.ts
```

## 🔑 Translation Key Organization

### Key Naming Convention

```typescript
// ✅ Good: Hierarchical and descriptive
"forms.validation.emailRequired": "Email is required"
"common.actions.save": "Save"
"pages.dashboard.title": "Dashboard"

// ❌ Bad: Flat and unclear
"emailRequired": "Email is required"
"save": "Save"
"dashboardTitle": "Dashboard"
```

### Key Categories

| Category | Description | Example |
|----------|-------------|---------|
| `common.*` | Shared elements | `common.actions.save` |
| `forms.*` | Form-related | `forms.validation.required` |
| `pages.*` | Page-specific | `pages.dashboard.title` |
| `navigation.*` | Menu items | `navigation.users` |
| `emptyStates.*` | Empty states | `emptyStates.noUsersFound` |
| `plurals.*` | Pluralization | `plurals.items` |

### File Structure

```json
{
  "_metadata": {
    "language": "English",
    "locale": "en-US",
    "version": "1.0.0"
  },
  "common": {
    "_context": "Shared UI elements",
    "actions": {
      "_context": "Common actions",
      "save": "Save",
      "cancel": "Cancel"
    }
  },
  "forms": {
    "_context": "Form-related translations",
    "validation": {
      "required": "This field is required"
    }
  }
}
```

## 💻 Development Workflow

### Adding New Translation Keys

1. **Add to Base Language (English)**

```json
// messages/en.json
{
  "users": {
    "actions": {
      "createUser": "Create User",
      "editUser": "Edit User"
    }
  }
}
```

2. **Add to All Other Languages**

```json
// messages/hr.json
{
  "users": {
    "actions": {
      "createUser": "Stvori Korisnika",
      "editUser": "Uredi Korisnika"
    }
  }
}
```

3. **Use in Component**

```typescript
function UserActions() {
  const t = useTranslations('users.actions')
  
  return (
    <div>
      <button>{t('createUser')}</button>
      <button>{t('editUser')}</button>
    </div>
  )
}
```

### Validation Workflow

```bash
# 1. Validate JSON syntax
npm run i18n:validate

# 2. Check for missing/orphaned keys
npm run i18n:find-orphaned

# 3. Verify key usage
npm run i18n:verify-usage

# 4. Auto-fix issues
npm run i18n:fix-orphaned
```

## 🔧 Advanced Usage

### Pluralization

```typescript
import { usePluralization } from '@/hooks/use-pluralization'

function ItemCount({ count }: { count: number }) {
  const { getPlural } = usePluralization()
  
  return <span>{getPlural('plurals.items', count)}</span>
  // 0: "no items" / "nema stavki"
  // 1: "1 item" / "1 stavka"  
  // 2-4: "2 items" / "2 stavke" (Croatian)
  // 5+: "5 items" / "5 stavki"
}
```

**Translation Files:**

```json
// en.json
"plurals": {
  "items": {
    "zero": "no items",
    "one": "1 item", 
    "other": "{count} items"
  }
}

// hr.json  
"plurals": {
  "items": {
    "zero": "nema stavki",
    "one": "{count} stavka",
    "few": "{count} stavke",
    "other": "{count} stavki"
  }
}
```

### Date and Number Formatting

```typescript
import { useLocaleFormat } from '@/hooks/use-locale-format'

function FormattedData() {
  const { formatDate, formatNumber, formatCurrency } = useLocaleFormat()
  
  return (
    <div>
      {/* Date formatting */}
      <span>{formatDate(new Date(), 'medium')}</span>
      // en: "Jan 15, 2024"
      // hr: "15. sij. 2024"
      // de: "15. Jan. 2024"
      
      {/* Number formatting */}
      <span>{formatNumber(1234.56, 'decimal')}</span>
      // en: "1,234.56"
      // hr: "1.234,56" 
      // de: "1.234,56"
      
      {/* Currency formatting */}
      <span>{formatCurrency(99.99)}</span>
      // en: "$99.99"
      // hr: "99,99 €"
      // de: "99,99 €"
    </div>
  )
}
```

### Dynamic Keys

```typescript
function DynamicTranslation({ status }: { status: string }) {
  const t = useTranslations('common.status')
  
  // ✅ Good: Using known status values
  const statusText = t(status as 'pending' | 'approved' | 'rejected')
  
  // ✅ Good: With fallback
  const statusWithFallback = t(status, { fallback: 'Unknown' })
  
  return <span>{statusText}</span>
}
```

### Interpolation

```typescript
function WelcomeMessage({ userName }: { userName: string }) {
  const t = useTranslations('messages')
  
  return (
    <h1>{t('welcome', { name: userName })}</h1>
    // Uses: "Welcome, {name}!" → "Welcome, John!"
  )
}
```

**Translation:**
```json
{
  "messages": {
    "welcome": "Welcome, {name}!",
    "itemCount": "You have {count} {count, plural, one {item} other {items}}"
  }
}
```

## 🎨 Component Patterns

### Language Switcher

```typescript
import { LanguageSwitcher } from '@/components/language/language-switcher'

// Dropdown variant
<LanguageSwitcher variant="dropdown" />

// Button group variant  
<LanguageSwitcher variant="buttons" />

// Minimal flags variant
<LanguageSwitcher variant="flags" />
```

### Conditional Rendering by Language

```typescript
import { useLocale } from 'next-intl'

function LocaleSpecificContent() {
  const locale = useLocale()
  
  return (
    <div>
      {/* Show different content for different locales */}
      {locale === 'de' && (
        <p>German-specific content with longer text...</p>
      )}
      
      {(locale === 'hr' || locale === 'bs') && (
        <p>Slavic languages specific content</p>
      )}
    </div>
  )
}
```

### Error Boundaries with i18n

```typescript
import { useTranslations } from 'next-intl'

function ErrorBoundary({ error }: { error: Error }) {
  const t = useTranslations('errors')
  
  return (
    <div className="error-boundary">
      <h2>{t('title')}</h2>
      <p>{t('message')}</p>
      <button onClick={() => window.location.reload()}>
        {t('reload')}
      </button>
    </div>
  )
}
```

## 🧪 Testing Translations

### Unit Testing

```typescript
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import MyComponent from './MyComponent'

const messages = {
  common: {
    actions: {
      save: 'Save'
    }
  }
}

test('renders translated text', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MyComponent />
    </NextIntlClientProvider>
  )
  
  expect(screen.getByText('Save')).toBeInTheDocument()
})
```

### Testing Multiple Languages

```typescript
describe.each(['en', 'hr', 'bs', 'de'])('MyComponent in %s', (locale) => {
  test('renders correctly', () => {
    const messages = loadMessages(locale)
    
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <MyComponent />
      </NextIntlClientProvider>
    )
    
    // Test language-specific behavior
  })
})
```

## ⚠️ Common Pitfalls

### ❌ Don't: Hardcode Strings

```typescript
// ❌ Bad
function BadComponent() {
  return <button>Save</button>
}

// ✅ Good  
function GoodComponent() {
  const t = useTranslations('common.actions')
  return <button>{t('save')}</button>
}
```

### ❌ Don't: Use Variables for Keys Without Validation

```typescript
// ❌ Bad: Runtime errors if key doesn't exist
const keyName = 'unknownKey'
const text = t(keyName)

// ✅ Good: Use known keys with TypeScript
const text = t('save' as const)

// ✅ Good: With fallback
const text = t(keyName, { fallback: 'Default text' })
```

### ❌ Don't: Assume Key Existence

```typescript
// ❌ Bad: No error handling
const title = t('pages.nonexistent.title')

// ✅ Good: With error handling
const title = t('pages.nonexistent.title', { 
  fallback: 'Default Title' 
})
```

### ❌ Don't: Forget Pluralization

```typescript
// ❌ Bad: Not handling plurals
function ItemList({ items }: { items: any[] }) {
  return <p>{items.length} items</p>
}

// ✅ Good: Using pluralization
function ItemList({ items }: { items: any[] }) {
  const { getPlural } = usePluralization()
  return <p>{getPlural('plurals.items', items.length)}</p>
}
```

## 🔧 Tools and Helpers

### VS Code Extensions

1. **i18n Ally** - Translation management
2. **JSON Tools** - JSON validation and formatting
3. **Error Lens** - Inline error display

### Development Scripts

```bash
# Validate all translations
npm run i18n:validate

# Find unused keys
npm run i18n:verify-usage

# Fix orphaned keys automatically
npm run i18n:fix-orphaned

# Run i18n tests
npm run test:i18n

# Build with validation
npm run build
```

### IDE Configuration

**VS Code settings.json:**
```json
{
  "i18n-ally.localesPaths": ["messages"],
  "i18n-ally.keystyle": "nested",
  "i18n-ally.defaultNamespace": "common",
  "i18n-ally.sourceLanguage": "en",
  "i18n-ally.displayLanguage": "en"
}
```

## 📦 Utilities and Helpers

### Custom Hook for Complex Translations

```typescript
// hooks/use-translated-status.ts
import { useTranslations } from 'next-intl'

export function useTranslatedStatus() {
  const t = useTranslations('common.status')
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('pending')
      case 'APPROVED': return t('approved')
      case 'REJECTED': return t('rejected')
      default: return t('unknown')
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'yellow'
      case 'APPROVED': return 'green'
      case 'REJECTED': return 'red'
      default: return 'gray'
    }
  }
  
  return { getStatusLabel, getStatusColor }
}
```

### Translation Helper Functions

```typescript
// lib/translation-helpers.ts
export function createTranslationKey(...parts: string[]): string {
  return parts.filter(Boolean).join('.')
}

export function isValidTranslationKey(key: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/.test(key)
}

export function extractNamespaceFromKey(key: string): string {
  const parts = key.split('.')
  return parts.slice(0, -1).join('.')
}
```

## 🚀 Performance Optimization

### Lazy Loading Translations

```typescript
// For large translation files
import { lazy } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### Memoization for Complex Translations

```typescript
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

function ComplexTranslation({ data }: { data: any[] }) {
  const t = useTranslations('messages')
  
  const translatedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      translatedStatus: t(`status.${item.status}`)
    }))
  }, [data, t])
  
  return (
    <ul>
      {translatedData.map(item => (
        <li key={item.id}>{item.translatedStatus}</li>
      ))}
    </ul>
  )
}
```

## 📋 Checklist for New Features

### Before Development
- [ ] Plan translation keys needed
- [ ] Check existing keys for reusability
- [ ] Design for longest language (German)
- [ ] Consider pluralization needs

### During Development
- [ ] Use translation hooks consistently
- [ ] Add keys to all language files
- [ ] Test with different languages
- [ ] Handle loading states

### Before Commit
- [ ] Run `npm run i18n:validate`
- [ ] Run `npm run i18n:verify-usage`
- [ ] Test language switching
- [ ] Check for console errors

### Before Deployment
- [ ] Run full i18n test suite
- [ ] Verify production build
- [ ] Test with real data
- [ ] Performance check

## 🆘 Troubleshooting

### Common Issues

**Issue**: Translation not showing
```typescript
// Check: Is the key spelled correctly?
// Check: Is the namespace correct?
// Check: Does the key exist in all language files?

// Debug: Add console.log
const t = useTranslations('common.actions')
console.log('Available keys:', Object.keys(t.raw))
```

**Issue**: Pluralization not working
```typescript
// Check: Are all plural forms defined?
// Check: Is the count passed correctly?
// Check: Are you using the pluralization hook?

// Debug:
const { getPlural } = usePluralization()
console.log('Plural result:', getPlural('plurals.items', count))
```

**Issue**: Language not switching
```typescript
// Check: Is the locale cookie set?
// Check: Is the page refreshing after language change?
// Check: Are you using the correct language codes?

// Debug:
import { useLocale } from 'next-intl'
const locale = useLocale()
console.log('Current locale:', locale)
```

### Debug Mode

```typescript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  // Log missing translations
  console.log('Missing translation keys:', missingKeys)
}
```

## 📚 Additional Resources

- [Next.js i18n Documentation](https://nextjs.org/docs/advanced-features/i18n)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [CLDR Plural Rules](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/language_plural_rules.html)

---

**Last Updated**: January 26, 2025  
**Version**: 1.0  
**Maintainer**: GS-CMS Development Team