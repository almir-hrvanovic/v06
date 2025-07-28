import { useTranslations } from 'next-intl';

/**
 * Safe translation function that provides fallbacks for missing keys
 */
export function useSafeTranslations() {
  const t = useTranslations();

  const safeT = (key: string, fallback?: string) => {
    try {
      return t(key);
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`, error);
      return fallback || key.split('.').pop() || key;
    }
  };

  const safeRoleT = (role: string) => {
    if (!role) return '';
    
    // Try multiple possible translation keys
    const possibleKeys = [
      `roles.${role}`,
      `user.roles.${role}`,
      `roles.${role.toLowerCase()}`,
    ];

    for (const key of possibleKeys) {
      try {
        return t(key);
      } catch (error) {
        // Continue to next key
      }
    }

    // Fallback to formatted role name
    console.warn(`No translation found for role: ${role}`);
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return { t: safeT, roleT: safeRoleT };
}