'use client';

import { useConsoleMonitor } from '@/hooks/use-console-monitor';

export function ConsoleMonitorProvider({ children }: { children: React.ReactNode }) {
  useConsoleMonitor();
  return <>{children}</>;
}