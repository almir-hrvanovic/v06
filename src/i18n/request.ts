import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie (will be set by user preference)
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'hr-HR';

  // Validate locale - support both old and new format
  const validLocales = ['hr', 'en', 'de', 'bs', 'hr-HR', 'en-US', 'de-DE', 'bs-BA'];
  let validatedLocale = validLocales.includes(locale) ? locale : 'hr-HR';
  
  // Normalize to simple format for file loading
  const normalizedLocale = validatedLocale.split('-')[0];

  // Load messages for the normalized locale with enhanced fallback chain
  let messages;
  try {
    switch (normalizedLocale) {
      case 'bs':
        // Bosnian with fallback chain: bs → hr → en
        try {
          messages = (await import('../../messages/bs.json')).default;
        } catch {
          try {
            messages = (await import('../../messages/hr.json')).default;
          } catch {
            messages = (await import('../../messages/en.json')).default;
          }
        }
        break;
      case 'hr':
        // Croatian with fallback chain: hr → en
        try {
          messages = (await import('../../messages/hr.json')).default;
        } catch {
          messages = (await import('../../messages/en.json')).default;
        }
        break;
      case 'en':
        // English (reference language, no fallback)
        messages = (await import('../../messages/en.json')).default;
        break;
      case 'de':
        // German with fallback chain: de → en
        try {
          messages = (await import('../../messages/de.json')).default;
        } catch {
          messages = (await import('../../messages/en.json')).default;
        }
        break;
      default:
        // Default fallback to English (reference language)
        messages = (await import('../../messages/en.json')).default;
    }
  } catch (error) {
    // Final fallback to English if any translation file fails to load
    console.warn('Translation loading failed, falling back to English:', error);
    try {
      messages = (await import('../../messages/en.json')).default;
    } catch (finalError) {
      console.error('Critical: English fallback failed:', finalError);
      // Return minimal fallback object
      messages = {
        common: {
          status: { loading: 'Loading...' },
          actions: { back: 'Back' }
        }
      };
    }
  }

  return {
    locale: validatedLocale,
    messages
  };
});