'use client'

import { Currency } from '@prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '@/lib/currency'

interface CurrencySelectorProps {
  value: Currency
  onChange: (currency: Currency) => void
  disabled?: boolean
  className?: string
}

export function CurrencySelector({
  value,
  onChange,
  disabled = false,
  className,
}: CurrencySelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as Currency)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          {CURRENCY_SYMBOLS[value]} - {CURRENCY_NAMES[value]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(Currency).map((currency) => (
          <SelectItem key={currency} value={currency}>
            <span className="font-mono mr-2">{CURRENCY_SYMBOLS[currency]}</span>
            {CURRENCY_NAMES[currency]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Compact version for inline use
export function CurrencySelectorCompact({
  value,
  onChange,
  disabled = false,
  className,
}: CurrencySelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as Currency)}
      disabled={disabled}
    >
      <SelectTrigger className={`w-20 ${className}`}>
        <SelectValue>{CURRENCY_SYMBOLS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(Currency).map((currency) => (
          <SelectItem key={currency} value={currency}>
            {CURRENCY_SYMBOLS[currency]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}