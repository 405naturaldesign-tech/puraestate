import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'PuraEstate - Find Your Perfect Property',
    template: '%s | PuraEstate',
  },
  description:
    'Discover, compare, and invest in properties with PuraEstate — the modern real estate platform for buyers, sellers, and agents.',
  keywords: [
    'real estate',
    'property',
    'homes for sale',
    'apartments',
    'buy property',
    'rent property',
    'real estate agent',
    'property listing',
    'house search',
    'investment property',
  ],
  authors: [{ name: 'PuraEstate', url: 'https://puraestate.com' }],
  creator: 'PuraEstate',
  publisher: 'PuraEstate',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://puraestate.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://puraestate.com',
    siteName: 'PuraEstate',
    title: 'PuraEstate - Find Your Perfect Property',
    description:
      'Discover, compare, and invest in properties with PuraEstate — the modern real estate platform.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PuraEstate - Find Your Perfect Property',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PuraEstate - Find Your Perfect Property',
    description: 'Discover, compare, and invest in properties with PuraEstate.',
    images: ['/og-image.jpg'],
    creator: '@puraestate',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-neutral-950">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'white' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
