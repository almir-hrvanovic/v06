"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePluralization, useLocaleFormat } from '@/hooks/use-pluralization';
import { getClientLocale } from '@/lib/locale';
import { Globe, Users, Package, AlertCircle } from 'lucide-react';

export default function I18nTestPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { getPlural, simplePartial } = usePluralization();
  const { formatDate, formatNumber } = useLocaleFormat();
  
  const [testCounts, setTestCounts] = useState({
    items: 5,
    users: 23,
    inquiries: 1,
    assignments: 0
  });

  const [currentLanguage, setCurrentLanguage] = useState(locale);

  const statusOptions = [
    { value: 'PENDING', key: 'common.status.pending' },
    { value: 'ASSIGNED', key: 'common.status.assigned' },
    { value: 'IN_PROGRESS', key: 'common.status.inProgress' },
    { value: 'COSTED', key: 'common.status.costed' },
    { value: 'APPROVED', key: 'common.status.approved' },
    { value: 'COMPLETED', key: 'common.status.completed' }
  ];

  const priorityOptions = [
    { value: 'LOW', key: 'common.priority.low' },
    { value: 'MEDIUM', key: 'common.priority.medium' },
    { value: 'HIGH', key: 'common.priority.high' },
    { value: 'URGENT', key: 'common.priority.urgent' }
  ];

  const handleLanguageChange = async (newLocale: string) => {
    setCurrentLanguage(newLocale);
    // Set locale cookie and reload to apply new locale
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const incrementCount = (key: keyof typeof testCounts) => {
    setTestCounts(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const decrementCount = (key: keyof typeof testCounts) => {
    setTestCounts(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            i18n Testing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Test 4-language support with pluralization and formatting
          </p>
        </div>
        
        {/* Language Switcher */}
        <Card className="w-64">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('header.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hr">🇭🇷 {t('header.croatian')}</SelectItem>
                <SelectItem value="bs">🇧🇦 {t('header.bosnian')}</SelectItem>
                <SelectItem value="en">🇺🇸 {t('header.english')}</SelectItem>
                <SelectItem value="de">🇩🇪 {t('header.german')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pluralization Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pluralization Test
            </CardTitle>
            <CardDescription>
              Test plural forms for different counts in {locale}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(testCounts).map(([key, count]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{key}</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => decrementCount(key as keyof typeof testCounts)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{count}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => incrementCount(key as keyof typeof testCounts)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getPlural(`plurals.${key}`, count)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status & Priority Translation Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Status & Priority
            </CardTitle>
            <CardDescription>
              Test status and priority translations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Status Options</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(({ value, key }) => (
                  <Badge key={value} variant="secondary">
                    {t(key)}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Priority Levels</h4>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map(({ value, key }) => (
                  <Badge 
                    key={value} 
                    variant={value === 'URGENT' ? 'destructive' : 'outline'}
                  >
                    {t(key)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder & Action Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              UI Text Testing
            </CardTitle>
            <CardDescription>
              Test placeholder and action text translations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Placeholders</h4>
              <div className="space-y-2">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectVP')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vp1">VP 1</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.allCustomers')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Action Buttons</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  {t('actions.saveChanges')}
                </Button>
                <Button size="sm" variant="outline">
                  {t('actions.assignToVP')}
                </Button>
                <Button size="sm" variant="outline">
                  {t('common.actions.cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Number Formatting */}
        <Card>
          <CardHeader>
            <CardTitle>Locale Formatting</CardTitle>
            <CardDescription>
              Test date and number formatting for {locale}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Date Formats</h4>
              <div className="text-sm space-y-1">
                <div>Short: {formatDate(new Date(), 'short')}</div>
                <div>Medium: {formatDate(new Date(), 'medium')}</div>
                <div>Long: {formatDate(new Date(), 'long')}</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Number Formats</h4>
              <div className="text-sm space-y-1">
                <div>Decimal: {formatNumber(1234.56, 'decimal')}</div>
                <div>Currency: {formatNumber(1234.56, 'currency')}</div>
                <div>Percent: {formatNumber(0.85, 'percent')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Stress Test */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Layout Stress Test</CardTitle>
            <CardDescription>
              Test how the layout handles longer German text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2">Normal Text</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('common.labels.name')}:</span>
                    <span>John Doe</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('common.labels.status')}:</span>
                    <Badge variant="secondary">{t('common.status.active')}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('common.labels.priority')}:</span>
                    <Badge variant="outline">{t('common.priority.high')}</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Long Content Test</h4>
                <div className="space-y-2 text-sm">
                  <div>{t('titles.inquiriesSummaryReport')}</div>
                  <div>{t('titles.customerAnalysisReport')}</div>
                  <div>{t('titles.analyticsDashboardReport')}</div>
                  <div className="flex gap-2">
                    <Button size="sm">{t('actions.updateCostCalculation')}</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Locale Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Locale Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <h4 className="text-sm font-medium">Locale</h4>
              <p className="text-sm text-muted-foreground">{locale}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Language</h4>
              <p className="text-sm text-muted-foreground">
                {locale === 'hr' ? 'Croatian' : 
                 locale === 'bs' ? 'Bosnian' :
                 locale === 'en' ? 'English' : 'German'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Sample Translation</h4>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.title')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Fallback Chain</h4>
              <p className="text-sm text-muted-foreground">
                {locale === 'bs' ? 'bs → hr → en' :
                 locale === 'hr' ? 'hr → en' :
                 locale === 'de' ? 'de → en' : 'en (default)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}