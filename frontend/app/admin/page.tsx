import type { Metadata } from 'next';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminDashboardContent } from './AdminDashboardContent';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'PuraEstate Admin Dashboard',
};

export default function AdminPage() {
  return (
    <DashboardLayout>
      <AdminDashboardContent />
    </DashboardLayout>
  );
}
