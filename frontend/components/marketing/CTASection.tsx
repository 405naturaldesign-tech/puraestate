import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-primary-900 to-primary-800 py-20">
      <div className="container-app text-center">
        <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Ready to Find Your Home?
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-primary-300">
          Join over 100,000 users who trust PuraEstate to find their perfect property. Start your
          search today — it&apos;s free.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="xl" variant="accent" asChild>
            <Link href="/auth/register">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" className="border-primary-600 text-white hover:bg-primary-800" asChild>
            <Link href="/properties">Browse Properties</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
