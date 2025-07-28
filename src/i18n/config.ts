/**
 * i18n Configuration for 4-Language GS-CMS
 * 
 * Supports Croatian, Bosnian, English, and German with:
 * - Pluralization rules
 * - Date/time formatting
 * - Number formatting
 * - Fallback chains
 */

import { Pathnames, LocalePrefix } from 'next-intl/routing';

// Supported locales
export const locales = ['hr', 'bs', 'en', 'de'] as const;
export type Locale = typeof locales[number];

// Default locale
export const defaultLocale: Locale = 'hr';

// Locale prefix for routing
export const localePrefix: LocalePrefix<typeof locales> = 'always';

// Pluralization rules for each language
export const pluralRules: Record<Locale, (count: number) => string> = {
  // Croatian pluralization: 1 = one, 2-4 = few, 0,5+ = other
  hr: (count: number) => {
    if (count === 1) return 'one';
    if (count >= 2 && count <= 4) return 'few';
    return 'other';
  },
  
  // Bosnian pluralization: same as Croatian
  bs: (count: number) => {
    if (count === 1) return 'one';
    if (count >= 2 && count <= 4) return 'few';
    return 'other';
  },
  
  // English pluralization: 1 = one, everything else = other
  en: (count: number) => {
    return count === 1 ? 'one' : 'other';
  },
  
  // German pluralization: 1 = one, everything else = other
  de: (count: number) => {
    return count === 1 ? 'one' : 'other';
  }
};

// Fallback chains
export const fallbackChains: Record<Locale, Locale[]> = {
  hr: ['en'], // Croatian → English
  bs: ['hr', 'en'], // Bosnian → Croatian → English
  en: [], // English (no fallback)
  de: ['en'] // German → English
};

// Date/time formatting patterns
export const dateTimeFormats: Record<Locale, {
  date: Intl.DateTimeFormatOptions;
  time: Intl.DateTimeFormatOptions;
  dateTime: Intl.DateTimeFormatOptions;
  short: Intl.DateTimeFormatOptions;
  medium: Intl.DateTimeFormatOptions;
  long: Intl.DateTimeFormatOptions;
}> = {
  hr: {
    date: { day: '2-digit', month: '2-digit', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    dateTime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false },
    short: { day: 'numeric', month: 'numeric', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  },
  bs: {
    date: { day: '2-digit', month: '2-digit', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    dateTime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false },
    short: { day: 'numeric', month: 'numeric', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  },
  en: {
    date: { month: '2-digit', day: '2-digit', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit', hour12: true },
    dateTime: { month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true },
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  },
  de: {
    date: { day: '2-digit', month: '2-digit', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    dateTime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false },
    short: { day: 'numeric', month: 'numeric', year: '2-digit' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  }
};

// Number formatting
export const numberFormats: Record<Locale, {
  decimal: Intl.NumberFormatOptions;
  currency: Intl.NumberFormatOptions;
  percent: Intl.NumberFormatOptions;
  integer: Intl.NumberFormatOptions;
}> = {
  hr: {
    decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 },
    currency: { style: 'currency', currency: 'EUR' },
    percent: { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 },
    integer: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }
  },
  bs: {
    decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 },
    currency: { style: 'currency', currency: 'BAM' },
    percent: { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 },
    integer: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }
  },
  en: {
    decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 },
    currency: { style: 'currency', currency: 'USD' },
    percent: { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 },
    integer: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }
  },
  de: {
    decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 },
    currency: { style: 'currency', currency: 'EUR' },
    percent: { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 },
    integer: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }
  }
};

// Pathnames for routing (if using next-intl routing)
export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
  '/dashboard': {
    hr: '/upravljacka-ploca',
    bs: '/upravljačka-ploča',
    en: '/dashboard',
    de: '/dashboard'
  },
  '/inquiries': {
    hr: '/upiti',
    bs: '/upiti',
    en: '/inquiries',
    de: '/anfragen'
  },
  '/customers': {
    hr: '/kupci',
    bs: '/kupci',
    en: '/customers',
    de: '/kunden'
  },
  '/users': {
    hr: '/korisnici',
    bs: '/korisnici',
    en: '/users',
    de: '/benutzer'
  }
};

// Language metadata
export const languageMetadata: Record<Locale, {
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  currencySymbol: string;
}> = {
  hr: {
    name: 'Croatian',
    nativeName: 'Hrvatski',
    flag: '🇭🇷',
    direction: 'ltr',
    currency: 'EUR',
    currencySymbol: '€'
  },
  bs: {
    name: 'Bosnian',
    nativeName: 'Bosanski',
    flag: '🇧🇦',
    direction: 'ltr',
    currency: 'BAM',
    currencySymbol: 'KM'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    currency: 'USD',
    currencySymbol: '$'
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
    currency: 'EUR',
    currencySymbol: '€'
  }
};

// Utility functions
export function normalizeLocale(locale: string): Locale {
  const baseLocale = locale.split('-')[0];
  return locales.includes(baseLocale as Locale) ? baseLocale as Locale : defaultLocale;
}

export function getFullLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    hr: 'hr-HR',
    bs: 'bs-BA',
    en: 'en-US',
    de: 'de-DE'
  };
  return localeMap[locale];
}

export function getFallbackChain(locale: Locale): Locale[] {
  return [locale, ...fallbackChains[locale]];
}