import { Facebook, Home, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  product: [
    { href: '/properties', label: 'Browse Properties' },
    { href: '/map', label: 'Map Search' },
    { href: '/agents', label: 'Find an Agent' },
    { href: '/analytics', label: 'Market Analytics' },
    { href: '/compare', label: 'Compare Properties' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/careers', label: 'Careers' },
    { href: '/blog', label: 'Blog' },
    { href: '/press', label: 'Press' },
    { href: '/contact', label: 'Contact' },
  ],
  support: [
    { href: '/help', label: 'Help Center' },
    { href: '/faq', label: 'FAQ' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
  ],
};

const socialLinks = [
  { href: 'https://twitter.com/puraestate', icon: Twitter, label: 'Twitter' },
  { href: 'https://facebook.com/puraestate', icon: Facebook, label: 'Facebook' },
  { href: 'https://instagram.com/puraestate', icon: Instagram, label: 'Instagram' },
  { href: 'https://linkedin.com/company/puraestate', icon: Linkedin, label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container-app py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Home className="h-5 w-5" />
              </div>
              <span className="gradient-text text-xl">PuraEstate</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
              The modern real estate platform for buyers, sellers, and agents. Find your perfect
              property with confidence.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800 sm:flex-row">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            &copy; {new Date().getFullYear()} PuraEstate. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            <span>Made with care for homebuyers everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
