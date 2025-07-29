'use client'

import * as React from 'react'
import { Currency } from '@prisma/client'
import { cn } from '@/lib/utils'
import { formatCurrencyInput, parseCurrencyAmount, getCurrencySymbol } from '@/lib/currency'
import { useMainCurrency } from '@/contexts/currency-context'

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string | null
  onChange?: (value: number | null) => void
  currency?: Currency
  showSymbol?: boolean
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, currency, showSymbol = true, ...props }, ref) => {
    const mainCurrency = useMainCurrency()
    const [displayValue, setDisplayValue] = React.useState('')
    const actualCurrency = currency || mainCurrency
    const symbol = getCurrencySymbol(actualCurrency)

    // Initialize display value from prop value
    React.useEffect(() => {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        if (!isNaN(numValue)) {
          // Format the number for display
          const formatted = new Intl.NumberFormat('hr-HR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(numValue)
          setDisplayValue(formatted)
        } else {
          setDisplayValue('')
        }
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Allow empty input
      if (!inputValue) {
        setDisplayValue('')
        onChange?.(null)
        return
      }

      // Format the input
      const formatted = formatCurrencyInput(inputValue, actualCurrency)
      setDisplayValue(formatted)

      // Parse the numeric value
      const numericValue = parseCurrencyAmount(formatted)
      onChange?.(numericValue)
    }

    const handleBlur = () => {
      // Reformat on blur to ensure proper formatting
      if (displayValue) {
        const numericValue = parseCurrencyAmount(displayValue)
        if (numericValue !== null) {
          const formatted = new Intl.NumberFormat('hr-HR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(numericValue)
          setDisplayValue(formatted)
        }
      }
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showSymbol && "pr-12",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {showSymbol && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {symbol}
          </div>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }