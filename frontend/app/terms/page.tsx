import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

export const metadata: Metadata = {
  title: 'Terms of Service | PuraEstate',
  description: 'Terms of Service for PuraEstate real estate platform. Your rights and obligations when using our services.',
};

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="container-app py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-sm text-neutral-500">Last Updated: July 3, 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">1. Acceptance of Terms</h2>
              <p className="mt-2">By accessing or using PuraEstate.com, you agree to these Terms. If you do not agree, do not use the platform. These Terms are a legally binding agreement between you and PuraEstate, operated by THE GOOD IDEA LLC, Oklahoma.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">2. Service Description</h2>
              <p className="mt-2">PuraEstate is an AI-enhanced real estate platform connecting buyers, sellers, agents, and investors with property intelligence and matching services. We may modify or suspend any aspect of the platform with reasonable notice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">3. User Accounts</h2>
              <p className="mt-2">You are responsible for maintaining your account credentials and all activity under your account. Accounts may be suspended for violation of these Terms, fraudulent activity, or extended inactivity.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">4. Acceptable Use</h2>
              <p className="mt-2">You agree not to: use the platform for illegal purposes, scrape or extract data without permission, submit false listings or reviews, use automated tools without authorization, or violate applicable law.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">5. Intellectual Property</h2>
              <p className="mt-2">The platform including its design, code, content, and AI models is owned by PuraEstate. User content is owned by you; you grant us a license to display and process it solely for operating the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">6. Disclaimers</h2>
              <p className="mt-2">The platform is provided "as is" without warranties. AI-generated insights are informational tools and do not constitute professional real estate, legal, or financial advice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">7. Governing Law</h2>
              <p className="mt-2">These Terms are governed by the laws of the State of Oklahoma. Disputes shall be resolved by binding arbitration in Oklahoma County.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">8. Contact</h2>
              <p className="mt-2">Email: legal@puraestate.com | THE GOOD IDEA LLC, Oklahoma City, Oklahoma</p>
            </section>
          </div>

          <div className="mt-10 flex gap-4 text-sm">
            <Link href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
            <Link href="/cookies" className="text-primary-600 hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}