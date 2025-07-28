"use client";

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { setLocaleCookie, getLocaleConfig } from '@/lib/locale';
import { Globe, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  fullLocale: string;
}

const LANGUAGES: Language[] = [
  {
    code: 'hr',
    name: 'Croatian',
    nativeName: 'Hrvatski',
    flag: '🇭🇷',
    fullLocale: 'hr-HR'
  },
  {
    code: 'bs', 
    name: 'Bosnian',
    nativeName: 'Bosanski',
    flag: '🇧🇦',
    fullLocale: 'bs-BA'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    fullLocale: 'en-US'
  },
  {
    code: 'de',
    name: 'German', 
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    fullLocale: 'de-DE'
  }
];

interface LanguageSwitcherProps {
  variant?: 'button' | 'inline' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'button', 
  showLabels = true,
  className 
}: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const t = useTranslations();
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = LANGUAGES.find(lang => 
    lang.code === currentLocale || lang.fullLocale === currentLocale
  ) || LANGUAGES[0];

  const handleLanguageChange = async (language: Language) => {
    if (language.code === currentLocale) return;
    
    setIsChanging(true);
    
    try {
      // Set the locale cookie
      await setLocaleCookie(language.fullLocale);
      
      // Show success message
      toast.success(
        `Language changed to ${language.nativeName}`,
        {
          description: 'The page will reload to apply the new language',
          duration: 2000
        }
      );
      
      // Small delay for user feedback, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error('Failed to change language');
      setIsChanging(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {LANGUAGES.map((language) => (
            <Button
              key={language.code}
              variant={language.code === currentLocale ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleLanguageChange(language)}
              disabled={isChanging}
              className="h-8 px-2"
            >
              <span className="mr-1">{language.flag}</span>
              {showLabels && language.code.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={isChanging}
            className={className}
          >
            {isChanging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="mr-1">{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              disabled={isChanging}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.nativeName}</span>
              </div>
              {language.code === currentLocale && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default button variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isChanging}
          className={className}
        >
          {isChanging ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Globe className="h-4 w-4 mr-2" />
          )}
          <span className="mr-1">{currentLanguage.flag}</span>
          {showLabels && (
            <>
              <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
              <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{t('settings.language.title')}</p>
          <p className="text-xs text-muted-foreground">
            {t('settings.language.description')}
          </p>
        </div>
        <DropdownMenuSeparator />
        
        {/* Language Family Groups */}
        <div className="px-2 py-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Slavic Languages
          </p>
        </div>
        {LANGUAGES.filter(lang => ['hr', 'bs'].includes(lang.code)).map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            disabled={isChanging}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-xs text-muted-foreground">{language.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {language.code === currentLocale ? (
                <Badge variant="default" className="text-xs">
                  {t('settings.language.current')}
                </Badge>
              ) : (
                language.code === 'bs' && (
                  <Badge variant="outline" className="text-xs">
                    Similar to Croatian
                  </Badge>
                )
              )}
              {language.code === currentLocale && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Germanic Languages
          </p>
        </div>
        {LANGUAGES.filter(lang => ['en', 'de'].includes(lang.code)).map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            disabled={isChanging}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <div>
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-xs text-muted-foreground">{language.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {language.code === currentLocale ? (
                <Badge variant="default" className="text-xs">
                  {t('settings.language.current')}
                </Badge>
              ) : (
                language.code === 'en' && (
                  <Badge variant="outline" className="text-xs">
                    Reference
                  </Badge>
                )
              )}
              {language.code === currentLocale && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        {/* Current Locale Info */}
        <div className="px-2 py-2">
          <div className="text-xs text-muted-foreground">
            <div>Current: {currentLanguage.fullLocale}</div>
            <div>Fallback: {
              currentLocale === 'bs' ? 'bs → hr → en' :
              currentLocale === 'hr' ? 'hr → en' :
              currentLocale === 'de' ? 'de → en' : 'en (reference)'
            }</div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Quick language switcher for mobile or compact spaces
 */
export function QuickLanguageSwitcher({ className }: { className?: string }) {
  return <LanguageSwitcher variant="compact" showLabels={false} className={className} />;
}

/**
 * Inline language switcher for settings pages
 */
export function InlineLanguageSwitcher({ className }: { className?: string }) {
  return <LanguageSwitcher variant="inline" className={className} />;
}