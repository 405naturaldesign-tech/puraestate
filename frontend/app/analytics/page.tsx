import type { Metadata } from 'next';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AnalyticsContent } from './AnalyticsContent';

export const metadata: Metadata = {
  title: 'Market Analytics',
  description: 'Real estate market trends, statistics, and insights',
};

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}
