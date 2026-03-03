import type { Metadata } from 'next';

import { AgentSection } from '@/components/marketing/AgentSection';
import { CTASection } from '@/components/marketing/CTASection';
import { FeaturedProperties } from '@/components/marketing/FeaturedProperties';
import { HeroSection } from '@/components/marketing/HeroSection';
import { MarketStats } from '@/components/marketing/MarketStats';
import { Testimonials } from '@/components/marketing/Testimonials';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

export const metadata: Metadata = {
  title: 'PuraEstate - Find Your Perfect Property',
  description:
    'Search thousands of properties for sale and rent. Connect with top agents and find your dream home with PuraEstate.',
};

export default function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <MarketStats />
      <FeaturedProperties />
      <AgentSection />
      <Testimonials />
      <CTASection />
    </MarketingLayout>
  );
}
