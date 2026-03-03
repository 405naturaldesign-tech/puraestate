import type { Metadata } from 'next';

import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { PropertyDetailContent } from './PropertyDetailContent';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // In production, fetch property data here for SEO
  return {
    title: `Property Details - ${params.slug}`,
    description: 'View detailed information about this property including photos, features, and contact the agent.',
    openGraph: {
      type: 'website',
      title: `Property Details - ${params.slug}`,
    },
  };
}

export default function PropertyDetailPage({ params }: PageProps) {
  return (
    <MarketingLayout>
      <PropertyDetailContent slug={params.slug} />
    </MarketingLayout>
  );
}
