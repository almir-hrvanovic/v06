import { useEffect } from 'react';
import { initializeConsoleMonitor, getConsoleMonitor } from '@/lib/console-monitor';

export function useConsoleMonitor() {
  useEffect(() => {
    // Initialize console monitor
    initializeConsoleMonitor();

    // Cleanup on unmount
    return () => {
      const currentMonitor = getConsoleMonitor();
      if (currentMonitor) {
        currentMonitor.forceFlush();
      }
    };
  }, []);
}