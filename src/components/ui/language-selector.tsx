'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function LanguageSelector() {
  const [language, setLanguage] = useState('en');
  const t = useTranslations('header');
  
  return (
    <div className="flex items-center space-x-2" data-testid="language-selector">
      <label className="text-sm font-medium">{t('language')}:</label>
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="en">{t('english')}</option>
        <option value="de">{t('german')}</option>
        <option value="hr">{t('croatian')}</option>
        <option value="bs">{t('bosnian')}</option>
      </select>
    </div>
  );
}