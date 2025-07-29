'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { setLocaleCookie } from '@/lib/locale';

const LOCALE_MAP: Record<string, string> = {
  'en': 'en-US',
  'de': 'de-DE', 
  'hr': 'hr-HR',
  'bs': 'bs-BA'
};

export function LanguageSelector() {
  const currentLocale = useLocale();
  const { update } = useSession();
  const [isChanging, setIsChanging] = useState(false);
  const t = useTranslations('header');
  
  // Extract short code from current locale
  const currentShortCode = currentLocale.split('-')[0];
  
  const handleLanguageChange = async (shortCode: string) => {
    if (shortCode === currentShortCode || isChanging) return;
    
    setIsChanging(true);
    const fullLocale = LOCALE_MAP[shortCode];
    
    try {
      // First, update the user's preferred language in the database
      const response = await fetch('/api/user/language', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: fullLocale
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user language preference');
      }

      // Update the session to reflect the new language preference
      await update({
        preferredLanguage: fullLocale
      });

      // Then set the locale cookie for immediate effect
      await setLocaleCookie(fullLocale);
      
      // Show success message
      toast.success('Language changed successfully', {
        description: 'Language preference saved. Page will reload.',
        duration: 2000
      });
      
      // Small delay for user feedback, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error('Failed to save language preference. Please try again.');
      setIsChanging(false);
    }
  };
  
  return (
    <div className="flex items-center space-x-2" data-testid="language-selector">
      <label className="text-sm font-medium">{t('language')}:</label>
      <select 
        value={currentShortCode}
        onChange={(e) => handleLanguageChange(e.target.value)}
        disabled={isChanging}
        className="border rounded px-2 py-1 text-sm disabled:opacity-50"
      >
        <option value="en">{t('english')}</option>
        <option value="de">{t('german')}</option>
        <option value="hr">{t('croatian')}</option>
        <option value="bs">{t('bosnian')}</option>
      </select>
      {isChanging && (
        <span className="text-xs text-muted-foreground">Saving...</span>
      )}
    </div>
  );
}