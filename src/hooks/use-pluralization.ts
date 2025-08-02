/**
 * Pluralization hook for 4-language support
 * 
 * Provides pluralization utilities for Croatian, Bosnian, English, and German
 */

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { pluralRules, type Locale } from '@/i18n/config';

interface PluralOptions {
  zero?: string;
  one?: string;
  few?: string;
  many?: string;
  other: string;
}

interface PluralTranslation {
  zero?: string;
  one?: string;
  few?: string;
  many?: string;
  other: string;
}

export function usePluralization() {
  const locale = useLocale() as Locale;
  const t = useTranslations();

  // Get the plural rule function for current locale
  const getPluralForm = useMemo(() => {
    return pluralRules[locale] || pluralRules.en;
  }, [locale]);

  /**
   * Format a plural translation based on count
   */
  const formatPlural = (count: number, options: PluralOptions): string => {
    // Handle zero case if provided
    if (count === 0 && options.zero) {
      return options.zero.replace('{count}', count.toString());
    }

    const pluralForm = getPluralForm(count);
    const template = options[pluralForm as keyof PluralOptions] || options.other;
    
    return template.replace('{count}', count.toString());
  };

  /**
   * Get plural translation from translation key
   */
  const getPlural = (key: string, count: number): string => {
    try {
      // Try to get the plural object from translations
      const pluralTranslation = t.raw(key) as PluralTranslation;
      
      if (typeof pluralTranslation === 'object' && pluralTranslation.other) {
        return formatPlural(count, pluralTranslation);
      }
      
      // Fallback to simple string with count replacement
      const simpleTranslation = t(key);
      return simpleTranslation.replace('{count}', count.toString());
    } catch (error) {
      console.warn(`Translation key "${key}" not found, using fallback`);
      return `${count} items`;
    }
  };

  /**
   * Format a simple plural with custom singular/plural forms
   */
  const simplePartial = (count: number, singular: string, plural: string): string => {
    if (locale === 'hr' || locale === 'bs') {
      // Croatian/Bosnian: 1 = singular, 2-4 = few (use singular), 0,5+ = plural
      if (count === 1) return `${count} ${singular}`;
      if (count >= 2 && count <= 4) return `${count} ${singular}`;
      return `${count} ${plural}`;
    } else {
      // English/German: 1 = singular, everything else = plural
      return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
    }
  };

  /**
   * Get localized count text (e.g., "5 items", "1 item", "No items")
   */
  const getCountText = (count: number, entityKey: string): string => {
    if (count === 0) {
      return getPlural(`plurals.${entityKey}.zero`, count) || t('common.labels.none');
    }
    return getPlural(`plurals.${entityKey}`, count);
  };

  return {
    formatPlural,
    getPlural,
    simplePartial,
    getCountText,
    locale,
    getPluralForm
  };
}

/**
 * Utility functions for common pluralization patterns
 */
export const pluralizationUtils = {
  /**
   * Get item count text with proper pluralization
   */
  items: (count: number, locale: Locale = 'en'): string => {
    const translations = {
      hr: { one: 'stavka', few: 'stavke', other: 'stavaka' },
      bs: { one: 'stavka', few: 'stavke', other: 'stavaka' },
      en: { one: 'item', other: 'items' },
      de: { one: 'Element', other: 'Elemente' }
    };
    
    const forms = translations[locale];
    const pluralForm = pluralRules[locale](count);
    const form = forms[pluralForm as keyof typeof forms] || forms.other;
    
    return `${count} ${form}`;
  },

  /**
   * Get inquiry count text with proper pluralization
   */
  inquiries: (count: number, locale: Locale = 'en'): string => {
    const translations = {
      hr: { one: 'upit', few: 'upita', other: 'upita' },
      bs: { one: 'upit', few: 'upita', other: 'upita' },
      en: { one: 'inquiry', other: 'inquiries' },
      de: { one: 'Anfrage', other: 'Anfragen' }
    };
    
    const forms = translations[locale];
    const pluralForm = pluralRules[locale](count);
    const form = forms[pluralForm as keyof typeof forms] || forms.other;
    
    return `${count} ${form}`;
  },

  /**
   * Get user count text with proper pluralization
   */
  users: (count: number, locale: Locale = 'en'): string => {
    const translations = {
      hr: { one: 'korisnik', few: 'korisnika', other: 'korisnika' },
      bs: { one: 'korisnik', few: 'korisnika', other: 'korisnika' },
      en: { one: 'user', other: 'users' },
      de: { one: 'Benutzer', other: 'Benutzer' }
    };
    
    const forms = translations[locale];
    const pluralForm = pluralRules[locale](count);
    const form = forms[pluralForm as keyof typeof forms] || forms.other;
    
    return `${count} ${form}`;
  },

  /**
   * Get assignment count text with proper pluralization
   */
  assignments: (count: number, locale: Locale = 'en'): string => {
    const translations = {
      hr: { one: 'zadatak', few: 'zadatka', other: 'zadataka' },
      bs: { one: 'zadatak', few: 'zadatka', other: 'zadataka' },
      en: { one: 'assignment', other: 'assignments' },
      de: { one: 'Aufgabe', other: 'Aufgaben' }
    };
    
    const forms = translations[locale];
    const pluralForm = pluralRules[locale](count);
    const form = forms[pluralForm as keyof typeof forms] || forms.other;
    
    return `${count} ${form}`;
  }
};

/**
 * Hook for locale-aware formatting
 */
export function useLocaleFormat() {
  const locale = useLocale() as Locale;

  const formatDate = (date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = {
      short: { day: 'numeric', month: 'numeric', year: '2-digit' },
      medium: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    }[format] as Intl.DateTimeFormatOptions;

    return new Intl.DateTimeFormat(locale, options).format(d);
  };

  const formatNumber = (num: number, style: 'decimal' | 'currency' | 'percent' = 'decimal'): string => {
    const currencies = { hr: 'EUR', bs: 'BAM', en: 'USD', de: 'EUR' };
    
    const options: Intl.NumberFormatOptions = {
      style,
      ...(style === 'currency' && { currency: currencies[locale] })
    };

    return new Intl.NumberFormat(locale, options).format(num);
  };

  const formatRelativeTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  };

  return {
    formatDate,
    formatNumber,
    formatRelativeTime,
    locale
  };
}