'use client'

import { useState, useEffect } from 'react'
import { Currency } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { CurrencySelectorCompact } from './currency-selector'
import { convertCurrency, formatCurrency } from '@/lib/currency'
import { useMainCurrency } from '@/contexts/currency-context'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: number
  onChange: (value: number, currency: Currency) => void
  currency?: Currency
  showConversion?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  id?: string
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  showConversion = true,
  disabled = false,
  placeholder = '0.00',
  className,
  id,
}: CurrencyInputProps) {
  const mainCurrency = useMainCurrency()
  const defaultCurrency = currency || mainCurrency
  const [inputValue, setInputValue] = useState(value.toString())
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency)
  const [convertedAmount, setConvertedAmount] = useState(0)

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    
    const numericValue = parseFloat(val) || 0
    onChange(numericValue, selectedCurrency)
  }

  const handleCurrencyChange = (newCurrency: Currency) => {
    setSelectedCurrency(newCurrency)
    const numericValue = parseFloat(inputValue) || 0
    onChange(numericValue, newCurrency)
  }

  // Calculate conversion if not in primary currency
  const showConversionInfo = showConversion && selectedCurrency !== mainCurrency
  
  useEffect(() => {
    const updateConversion = async () => {
      if (showConversionInfo) {
        const amount = await convertCurrency(parseFloat(inputValue) || 0, selectedCurrency, mainCurrency)
        setConvertedAmount(amount)
      } else {
        setConvertedAmount(0)
      }
    }
    updateConversion()
  }, [showConversionInfo, inputValue, selectedCurrency, mainCurrency])

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          step="0.01"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn("flex-1", className)}
        />
        <CurrencySelectorCompact
          value={selectedCurrency}
          onChange={handleCurrencyChange}
          disabled={disabled}
        />
      </div>
      {showConversionInfo && (
        <p className="text-sm text-muted-foreground">
          ≈ {formatCurrency(convertedAmount, mainCurrency)}
        </p>
      )}
    </div>
  )
}