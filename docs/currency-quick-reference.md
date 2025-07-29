# Currency System Quick Reference

## 🚀 Most Common Operations

### Get Main Currency
```typescript
import { useMainCurrency } from '@/contexts/currency-context'

const mainCurrency = useMainCurrency() // e.g., 'EUR'
```

### Format Currency
```typescript
import { formatCurrency } from '@/lib/currency'

formatCurrency(100, Currency.EUR)           // "100,00 €"
formatCurrency(100, Currency.BAM, 'bs-BA')  // "100,00 KM"
```

### Convert Currency
```typescript
import { convertCurrency } from '@/lib/currency'

// Note: This is async!
const eurAmount = await convertCurrency(100, Currency.BAM, Currency.EUR)
```

### Currency Input Component
```typescript
import { CurrencyInput } from '@/components/currency-input'

<CurrencyInput
  value={amount}
  onChange={(value, currency) => {
    setAmount(value)
    setCurrency(currency)
  }}
  showConversion={true}  // Shows conversion to main currency
/>
```

## 🔑 Key Files

| Purpose | File Location |
|---------|--------------|
| Currency utilities | `/src/lib/currency.ts` |
| React context | `/src/contexts/currency-context.tsx` |
| Settings page | `/src/app/dashboard/system-settings/page.tsx` |
| API endpoints | `/src/app/api/system-settings/route.ts` |
| Input component | `/src/components/currency-input.tsx` |
| Currency selector | `/src/components/currency-selector.tsx` |

## ⚠️ Important Rules

1. **SUPERUSER Only**: Only SUPERUSER can change currency settings
2. **Async Conversion**: `convertCurrency()` returns a Promise
3. **Main Currency**: All calculations should use main currency
4. **Cache**: Settings are cached for 5 minutes

## 📝 Example: Cost Calculation Form

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useMainCurrency } from '@/contexts/currency-context'
import { CurrencyInput } from '@/components/currency-input'
import { convertCurrency } from '@/lib/currency'

export function CostForm() {
  const mainCurrency = useMainCurrency()
  const [materialCost, setMaterialCost] = useState(0)
  const [materialCurrency, setMaterialCurrency] = useState(mainCurrency)
  const [laborCost, setLaborCost] = useState(0)
  const [laborCurrency, setLaborCurrency] = useState(mainCurrency)
  const [total, setTotal] = useState(0)

  // Calculate total in main currency
  useEffect(() => {
    const calculateTotal = async () => {
      const material = await convertCurrency(materialCost, materialCurrency, mainCurrency)
      const labor = await convertCurrency(laborCost, laborCurrency, mainCurrency)
      setTotal(material + labor)
    }
    calculateTotal()
  }, [materialCost, materialCurrency, laborCost, laborCurrency, mainCurrency])

  return (
    <div>
      <CurrencyInput
        value={materialCost}
        onChange={(value, currency) => {
          setMaterialCost(value)
          setMaterialCurrency(currency)
        }}
      />
      <CurrencyInput
        value={laborCost}
        onChange={(value, currency) => {
          setLaborCost(value)
          setLaborCurrency(currency)
        }}
      />
      <div>Total: {formatCurrency(total, mainCurrency)}</div>
    </div>
  )
}
```

## 🌍 Supported Currencies

| Code | Symbol | Name |
|------|--------|------|
| EUR | € | Euro |
| BAM | KM | Convertible Mark |
| USD | $ | US Dollar |
| GBP | £ | British Pound |
| CHF | CHF | Swiss Franc |
| HRK | kn | Croatian Kuna |
| RSD | дин | Serbian Dinar |

## 🛠️ System Settings Access

Only SUPERUSER can access: `/dashboard/system-settings`

Settings include:
- Main currency selection
- Additional currency 1 + exchange rate
- Additional currency 2 + exchange rate

## 🐛 Common Issues & Solutions

### Issue: Currency not updating
```typescript
// Make sure component is wrapped in provider
<CurrencyProvider>
  <YourComponent />
</CurrencyProvider>
```

### Issue: Conversion returns Promise
```typescript
// ❌ Wrong
const converted = convertCurrency(100, from, to)

// ✅ Correct
const converted = await convertCurrency(100, from, to)
```

### Issue: Can't access settings page
```bash
# Check user role in database
# User must have role: SUPERUSER
```

## 📚 Full Documentation

See [`/docs/currency-system.md`](./currency-system.md) for complete documentation.