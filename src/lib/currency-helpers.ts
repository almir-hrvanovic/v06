import { Currency } from '@prisma/client'
import { formatCurrency as formatCurrencyBase, getSystemSettingsSync } from './currency'

/**
 * Format currency using system main currency
 * For use in server components where hooks are not available
 */
export function formatWithSystemCurrency(
  amount: number | string | null | undefined,
  locale = 'hr-HR'
): string {
  const settings = getSystemSettingsSync()
  return formatCurrencyBase(amount, settings.mainCurrency, locale)
}

/**
 * Get system main currency synchronously
 * For use in server components where hooks are not available
 */
export function getSystemMainCurrency(): Currency {
  const settings = getSystemSettingsSync()
  return settings.mainCurrency
}