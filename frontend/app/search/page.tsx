import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { PropertiesContent } from '../properties/PropertiesContent';

export const metadata: Metadata = {
  title: 'Search Properties',
  description: 'Advanced property search with filters for price, location, type, and more.',
};

export default function SearchPage() {
  return (
    <MarketingLayout>
      <Suspense>
        <PropertiesContent />
      </Suspense>
    </MarketingLayout>
  );
}
