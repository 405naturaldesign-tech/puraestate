'use client';

import { useState } from 'react';

import { MapPin, Search, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { buildSearchUrl } from '@/lib/utils';

const listingTypes = [
  { value: 'sale', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'auction', label: 'Auction' },
];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [listingType, setListingType] = useState('sale');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = buildSearchUrl({ query, listing_type: listingType });
    router.push(`/properties${params}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-20 md:py-32">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />

      {/* Gradient orbs */}
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="container-app relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-700 bg-primary-800/50 px-4 py-1.5 text-sm text-primary-300">
            <TrendingUp className="h-4 w-4 text-accent-400" />
            <span>Over 50,000 properties listed</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Find Your{' '}
            <span className="bg-gradient-to-r from-accent-400 to-accent-300 bg-clip-text text-transparent">
              Perfect
            </span>{' '}
            Property
          </h1>

          <p className="mb-10 text-lg text-primary-300 md:text-xl">
            Search thousands of properties for sale and rent. Connect with top agents and find your
            dream home with confidence.
          </p>

          {/* Search Form */}
          <div className="mx-auto max-w-2xl">
            {/* Listing type tabs */}
            <div className="mb-3 flex justify-center">
              <div className="inline-flex rounded-xl bg-primary-800/50 p-1">
                {listingTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setListingType(type.value)}
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                      listingType === type.value
                        ? 'bg-white text-primary-900 shadow-sm'
                        : 'text-primary-300 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search input */}
            <form
              onSubmit={handleSearch}
              className="flex overflow-hidden rounded-2xl border border-primary-700 bg-white/10 shadow-xl backdrop-blur-sm"
            >
              <div className="flex flex-1 items-center px-4">
                <MapPin className="mr-3 h-5 w-5 shrink-0 text-primary-300" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter city, neighborhood, or ZIP code..."
                  className="w-full bg-transparent py-4 text-white placeholder-primary-400 outline-none"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="m-2 rounded-xl"
                leftIcon={<Search className="h-4 w-4" />}
              >
                Search
              </Button>
            </form>

            {/* Quick links */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-primary-400">
              <span>Popular:</span>
              {['New York', 'Los Angeles', 'Miami', 'Chicago', 'Austin'].map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setQuery(city);
                    router.push(`/properties?query=${encodeURIComponent(city)}&listing_type=${listingType}`);
                  }}
                  className="rounded-full border border-primary-700 px-3 py-1 text-primary-300 transition-colors hover:border-primary-500 hover:text-white"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
