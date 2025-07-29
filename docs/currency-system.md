# Currency System Documentation

## Overview
The application implements a system-wide currency configuration that is managed exclusively by SUPERUSER role. The system supports a main currency and up to 2 additional currencies with exchange rates for automatic conversion.

## Architecture

### Core Principles
- **System-level Configuration**: Currency settings are application-wide, not user-specific
- **SUPERUSER Control**: Only SUPERUSER can modify currency settings
- **Automatic Conversion**: All amounts are converted to main currency for calculations
- **Multi-currency Support**: Supports up to 3 currencies simultaneously
- **Real-time Exchange Rates**: Exchange rates are stored and used for conversions

## Database Schema

### SystemSettings Model
Location: `/prisma/schema.prisma`

```prisma
model SystemSettings {
  id                  String   @id @default(cuid())
  mainCurrency        Currency @default(EUR)
  additionalCurrency1 Currency?
  additionalCurrency2 Currency?
  exchangeRate1       Decimal? @db.Decimal(10, 6)
  exchangeRate2       Decimal? @db.Decimal(10, 6)
  updatedAt           DateTime @updatedAt
  updatedById         String?
  updatedBy           User?    @relation(fields: [updatedById], references: [id])
}

enum Currency {
  EUR
  BAM
  USD
  GBP
  CHF
  HRK
  RSD
}
```

## Components & Files

### 1. Currency Utilities
**Location**: `/src/lib/currency.ts`

Key functions:
- `getSystemSettings()`: Fetches and caches system currency settings
- `convertCurrency(amount, from, to)`: Converts amounts between currencies
- `formatCurrency(amount, currency, locale)`: Formats currency with proper symbols
- `formatCurrencyBase()`: Base formatting function
- `convertToMainCurrency()`: Helper to convert to system's main currency

```typescript
// Example usage
const eurAmount = await convertCurrency(100, Currency.BAM, Currency.EUR)
const formatted = formatCurrency(100, Currency.EUR, 'hr-HR') // "100,00 €"
```

### 2. Currency Context Provider
**Location**: `/src/contexts/currency-context.tsx`

Provides React hooks for currency operations:
- `useCurrency()`: Returns complete currency settings
- `useMainCurrency()`: Returns only the main currency
- `useAvailableCurrencies()`: Returns array of configured currencies

```typescript
// Example usage in components
const mainCurrency = useMainCurrency()
const { mainCurrency, additionalCurrencies } = useCurrency()
```

### 3. System Settings Page
**Location**: `/src/app/dashboard/system-settings/page.tsx`

SUPERUSER-only page for managing currency configuration:
- Select main currency
- Configure up to 2 additional currencies
- Set exchange rates for additional currencies
- Confirmation dialog for changes
- Real-time validation

### 4. API Endpoints
**Location**: `/src/app/api/system-settings/route.ts`

- `GET /api/system-settings`: Retrieve current settings (authenticated users)
- `PUT /api/system-settings`: Update settings (SUPERUSER only)

### 5. Currency Input Component
**Location**: `/src/components/currency-input.tsx`

Custom input component with:
- Currency selector
- Automatic conversion display
- Support for multiple currencies
- Real-time conversion preview

```typescript
<CurrencyInput
  value={amount}
  onChange={(value, currency) => handleChange(value, currency)}
  currency={Currency.EUR}
  showConversion={true}
/>
```

### 6. Currency Selector Components
**Location**: `/src/components/currency-selector.tsx`

- `CurrencySelector`: Full currency selector with icons
- `CurrencySelectorCompact`: Compact version for forms

### 7. Server-side Helpers
**Location**: `/src/lib/currency-helpers.ts`

For server components that can't use React context:
- `formatWithSystemCurrency()`: Format using main currency
- `getSystemSettingsSync()`: Synchronous settings retrieval

## Implementation Flow

### 1. Initial Setup
1. Database migration creates SystemSettings table
2. First API call creates default settings (EUR as main currency)
3. Settings are cached for performance

### 2. Currency Selection Flow
```
User selects currency → Component updates → Conversion happens → Display updated
                          ↓
                    If main currency differs
                          ↓
                    Show conversion preview
```

### 3. Settings Update Flow (SUPERUSER only)
```
SUPERUSER → System Settings Page → Select Currencies → Set Exchange Rates
    ↓                                                         ↓
Confirm Dialog ← Validation ← Save to Database ← API Call
    ↓
Update Cache → Notify Components → Re-render with new settings
```

## Currency Configuration

### Supported Currencies
- **EUR** (€) - Euro
- **BAM** (KM) - Bosnia and Herzegovina Convertible Mark
- **USD** ($) - US Dollar
- **GBP** (£) - British Pound
- **CHF** (CHF) - Swiss Franc
- **HRK** (kn) - Croatian Kuna
- **RSD** (дин) - Serbian Dinar

### Locale Formatting
The system supports multiple locales for number formatting:
- `hr-HR` - Croatian
- `bs-BA` - Bosnian
- `en-US` - English (US)

## Usage Examples

### In Client Components
```typescript
import { useMainCurrency, useCurrency } from '@/contexts/currency-context'
import { formatCurrency, convertCurrency } from '@/lib/currency'

function PriceDisplay({ amount, currency }) {
  const mainCurrency = useMainCurrency()
  const [converted, setConverted] = useState(0)
  
  useEffect(() => {
    convertCurrency(amount, currency, mainCurrency)
      .then(setConverted)
  }, [amount, currency, mainCurrency])
  
  return (
    <div>
      <span>{formatCurrency(amount, currency)}</span>
      {currency !== mainCurrency && (
        <span>≈ {formatCurrency(converted, mainCurrency)}</span>
      )}
    </div>
  )
}
```

### In API Routes
```typescript
import { auth } from '@/auth'
import { getSystemSettings } from '@/lib/currency'

export async function POST(request: Request) {
  const settings = await getSystemSettings()
  const { amount, currency } = await request.json()
  
  // Convert to main currency for storage
  const mainAmount = await convertCurrency(
    amount, 
    currency, 
    settings.mainCurrency
  )
  
  // Store in database...
}
```

### In Forms
```typescript
import { CurrencyInput } from '@/components/currency-input'

function CostForm() {
  const [cost, setCost] = useState(0)
  const [currency, setCurrency] = useState<Currency>()
  
  return (
    <CurrencyInput
      value={cost}
      onChange={(value, curr) => {
        setCost(value)
        setCurrency(curr)
      }}
      showConversion={true}
    />
  )
}
```

## Best Practices

### 1. Always Convert for Calculations
```typescript
// ✅ Good - Convert to main currency for calculations
const totalMain = await Promise.all([
  convertCurrency(cost1, curr1, mainCurrency),
  convertCurrency(cost2, curr2, mainCurrency),
  convertCurrency(cost3, curr3, mainCurrency)
]).then(amounts => amounts.reduce((a, b) => a + b, 0))

// ❌ Bad - Adding different currencies directly
const total = cost1 + cost2 + cost3
```

### 2. Handle Async Conversions
```typescript
// ✅ Good - Proper async handling
useEffect(() => {
  const updateConversion = async () => {
    const converted = await convertCurrency(amount, from, to)
    setConvertedAmount(converted)
  }
  updateConversion()
}, [amount, from, to])

// ❌ Bad - Not handling promise
const converted = convertCurrency(amount, from, to) // Returns Promise!
```

### 3. Cache Settings When Possible
```typescript
// ✅ Good - Use context in client components
const mainCurrency = useMainCurrency()

// ✅ Good - Settings are cached automatically
const settings = await getSystemSettings() // Cached for 5 minutes
```

### 4. Validate Currency Configuration
```typescript
// ✅ Good - Validate before saving
if (additionalCurrency1 === mainCurrency) {
  throw new Error('Additional currency cannot be same as main currency')
}
if (additionalCurrency1 && !exchangeRate1) {
  throw new Error('Exchange rate required for additional currency')
}
```

## Troubleshooting

### Common Issues

1. **Currency not updating in UI**
   - Check if component is wrapped in `CurrencyProvider`
   - Verify component is using hooks correctly
   - Clear cache if needed

2. **Conversion showing wrong values**
   - Verify exchange rates are set correctly
   - Check conversion direction (from/to)
   - Ensure amounts are numbers, not strings

3. **SUPERUSER can't access settings**
   - Verify user role in database
   - Check authentication session
   - Ensure proper navigation setup

### Debug Helpers

```typescript
// Check current settings
const settings = await getSystemSettings()
console.log('Current settings:', settings)

// Test conversion
const test = await convertCurrency(100, Currency.BAM, Currency.EUR)
console.log('100 BAM = ', test, 'EUR')

// Verify cache
import { systemSettingsCache } from '@/lib/currency'
console.log('Cache status:', systemSettingsCache)
```

## Security Considerations

1. **Role-based Access**: Only SUPERUSER can modify settings
2. **Audit Trail**: All changes are logged with user and timestamp
3. **Validation**: Strict validation on API endpoints
4. **Type Safety**: Full TypeScript coverage prevents errors

## Performance Optimizations

1. **Caching**: Settings cached for 5 minutes to reduce DB calls
2. **Memoization**: Currency symbols and configs are memoized
3. **Batch Operations**: Convert multiple amounts in parallel
4. **Lazy Loading**: Currency context loads settings on demand

## Future Enhancements

1. **Historical Exchange Rates**: Track rate changes over time
2. **External API Integration**: Fetch real-time exchange rates
3. **Multi-tenant Support**: Different settings per organization
4. **Currency Restrictions**: Limit available currencies per deployment
5. **Audit Reports**: Detailed reports of currency conversions

## Related Files Reference

- Database Schema: `/prisma/schema.prisma:212-224`
- Currency Utilities: `/src/lib/currency.ts`
- Context Provider: `/src/contexts/currency-context.tsx`
- System Settings Page: `/src/app/dashboard/system-settings/page.tsx`
- API Routes: `/src/app/api/system-settings/route.ts`
- Currency Input: `/src/components/currency-input.tsx`
- Currency Selector: `/src/components/currency-selector.tsx`
- Server Helpers: `/src/lib/currency-helpers.ts`