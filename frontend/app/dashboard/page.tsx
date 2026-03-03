import type { Metadata } from 'next';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardContent } from './DashboardContent';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your PuraEstate dashboard',
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
