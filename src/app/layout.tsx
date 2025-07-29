import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import "@uploadthing/react/styles.css";
import "../styles/i18n.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { AuthProvider } from '@/components/providers/auth-provider'
import { LocaleProvider } from '@/components/providers/locale-provider'
import { ConsoleMonitorProvider } from '@/components/providers/console-monitor-provider'
import { ThemeProvider } from '@/contexts/theme-context'
import { NextIntlClientProvider } from 'next-intl'
import { cookies } from 'next/headers'
import { ErrorBoundary } from '@/components/error-boundary'
import { AutoLoginProvider } from '@/components/auth/auto-login-provider'

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: "GS-Star v5.1 - Customer Relationship & Quote Management System",
  description: "Modern CMS for managing customer inquiries, quotes, and production orders with role-based workflows",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get locale from cookie
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'hr-HR';
  const validLocales = ['hr', 'bs', 'en', 'de', 'hr-HR', 'bs-BA', 'en-US', 'de-DE'];
  const validatedLocale = validLocales.includes(locale) ? locale : 'hr-HR';
  
  // Normalize to simple format for file loading
  const normalizedLocale = validatedLocale.split('-')[0];

  // Load messages for the current locale with error handling
  let messages;
  try {
    switch (normalizedLocale) {
      case 'hr':
        messages = (await import('../../messages/hr.json')).default;
        break;
      case 'en':
        messages = (await import('../../messages/en.json')).default;
        break;
      case 'de':
        messages = (await import('../../messages/de.json')).default;
        break;
      case 'bs':
        messages = (await import('../../messages/bs.json')).default;
        break;
      default:
        messages = (await import('../../messages/hr.json')).default;
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${normalizedLocale}:`, error);
    // Fallback to Croatian
    messages = (await import('../../messages/hr.json')).default;
  }

  return (
    <html lang={validatedLocale}>
      <body className={inter.className}>
        <NextSSRPlugin
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <NextIntlClientProvider 
          locale={validatedLocale} 
          messages={messages}
        >
          <ThemeProvider defaultTheme="system" storageKey="gs-cms-theme">
            <AuthProvider>
              <AutoLoginProvider>
                <LocaleProvider>
                  <ConsoleMonitorProvider>
                    {children}
                  </ConsoleMonitorProvider>
                </LocaleProvider>
              </AutoLoginProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}