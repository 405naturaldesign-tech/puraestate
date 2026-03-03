import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { AgentsContent } from './AgentsContent';

export const metadata: Metadata = {
  title: 'Find a Real Estate Agent',
  description: 'Browse verified real estate agents and find the perfect professional to help you buy, sell, or rent.',
};

export default function AgentsPage() {
  return (
    <MarketingLayout>
      <AgentsContent />
    </MarketingLayout>
  );
}
