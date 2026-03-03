import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { PropertiesContent } from './PropertiesContent';

export const metadata: Metadata = {
  title: 'Browse Properties',
  description:
    'Search thousands of properties for sale and rent. Use advanced filters to find your perfect home.',
};

export default function PropertiesPage() {
  return (
    <MarketingLayout>
      <PropertiesContent />
    </MarketingLayout>
  );
}
