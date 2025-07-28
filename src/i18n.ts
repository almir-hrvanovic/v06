import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = ['hr', 'en', 'de', 'bs'];

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is defined and valid
  let validLocale = locale || 'hr';
  if (!locales.includes(validLocale as any)) {
    console.warn(`Invalid locale: ${locale}, falling back to 'hr'`);
    validLocale = 'hr';
  }

  try {
    return {
      locale: validLocale,
      messages: (await import(`../messages/${validLocale}.json`)).default
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${validLocale}`, error);
    
    // Fallback to Croatian if the requested locale fails
    return {
      locale: 'hr',
      messages: (await import(`../messages/hr.json`)).default
    };
  }
});