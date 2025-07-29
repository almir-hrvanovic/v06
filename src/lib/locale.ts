import { formatDate, formatDateTime, formatCurrency, formatRelativeTime } from './utils';

// Client-side cookie functions
export function setLocaleCookie(locale: string): Promise<void> {
  return new Promise((resolve) => {
    document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
    resolve();
  });
}

// Server-side cookie functions (for server components)
export async function getLocaleCookieServer(): Promise<string> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('locale')?.value || 'hr-HR';
}

export function isValidLocale(locale: string): boolean {
  return ['hr', 'en', 'de', 'bs', 'hr-HR', 'en-US', 'de-DE', 'bs-BA'].includes(locale);
}

// Client-side locale-aware formatting utilities
export function getClientLocale(): string {
  if (typeof window === 'undefined') return 'hr-HR';
  
  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'locale') {
      return value;
    }
  }
  
  // Fallback to browser language or default
  return navigator.language || 'hr-HR';
}

// Locale-specific configuration
export const LOCALE_CONFIG = {
  'hr-HR': {
    name: 'Croatian',
    nativeName: 'Hrvatski',
    currency: 'EUR',
    currencySymbol: '€',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
    decimal: ',',
    thousands: '.'
  },
  'bs-BA': {
    name: 'Bosnian',
    nativeName: 'Bosanski',
    currency: 'BAM',
    currencySymbol: 'KM',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
    decimal: ',',
    thousands: '.'
  },
  'en-US': {
    name: 'English',
    nativeName: 'English',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    weekStart: 0, // Sunday
    decimal: '.',
    thousands: ','
  },
  'de-DE': {
    name: 'German',
    nativeName: 'Deutsch',
    currency: 'EUR',
    currencySymbol: '€',
    dateFormat: 'dd.MM.yyyy',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
    decimal: ',',
    thousands: '.'
  }
} as const;

export function getLocaleConfig(locale: string) {
  // Normalize locale (bs -> bs-BA, hr -> hr-HR, etc.)
  const normalizedLocale = locale.includes('-') 
    ? locale 
    : locale === 'bs' ? 'bs-BA'
    : locale === 'hr' ? 'hr-HR'
    : locale === 'en' ? 'en-US'
    : locale === 'de' ? 'de-DE'
    : 'hr-HR';
    
  return LOCALE_CONFIG[normalizedLocale as keyof typeof LOCALE_CONFIG] || LOCALE_CONFIG['hr-HR'];
}

// Locale-aware formatting functions for client-side use
export function formatDateLocalized(date: Date | string): string {
  return formatDate(date, getClientLocale());
}

export function formatDateTimeLocalized(date: Date | string): string {
  return formatDateTime(date, getClientLocale());
}

export function formatCurrencyLocalized(amount: number | string): string {
  return formatCurrency(amount, getClientLocale());
}

export function formatRelativeTimeLocalized(date: Date | string): string {
  return formatRelativeTime(date, getClientLocale());
}

// Bosnia-specific formatting utilities
export function formatCurrencyBosnia(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('bs-BA', {
    style: 'currency',
    currency: 'BAM',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatDateBosnia(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

export function formatNumberBosnia(num: number): string {
  return new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
}