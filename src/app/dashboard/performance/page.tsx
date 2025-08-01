import { Metadata } from 'next';
import { PerformanceDashboard } from '@/components/monitoring/performance-dashboard';

export const metadata: Metadata = {
  title: 'Performance Dashboard',
  description: 'Real-time performance monitoring and optimization tracking',
};

export default function PerformancePage() {
  return <PerformanceDashboard />;
}