'use client';

import {
  BarChart3,
  Bell,
  BookmarkCheck,
  Building2,
  Heart,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

import { StatsCard } from '@/components/analytics/StatsCard';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/hooks/useAuth';
import { useFeaturedProperties } from '@/lib/hooks/useProperties';

export function DashboardContent() {
  const { user } = useAuth();
  const { data: properties, isLoading } = useFeaturedProperties(3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 17) {
      return 'Good afternoon';
    }
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {greeting()}, {user?.first_name}!
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Here&apos;s what&apos;s happening with your real estate activity.
          </p>
        </div>
        <Button asChild>
          <Link href="/properties">
            <Building2 className="mr-2 h-4 w-4" />
            Browse Properties
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Heart}
          label="Saved Properties"
          value={12}
          change={16.7}
          changeLabel="vs last month"
          color="danger"
        />
        <StatsCard
          icon={BookmarkCheck}
          label="Saved Searches"
          value={5}
          change={25.0}
          changeLabel="vs last month"
          color="primary"
        />
        <StatsCard
          icon={Bell}
          label="New Alerts"
          value={3}
          color="warning"
        />
        <StatsCard
          icon={TrendingUp}
          label="Properties Viewed"
          value={48}
          change={12.5}
          changeLabel="vs last month"
          color="success"
        />
      </div>

      {/* Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { href: '/search', icon: MapPin, label: 'Search Properties', description: 'Find your perfect match' },
                { href: '/favorites', icon: Heart, label: 'My Favorites', description: '12 saved properties' },
                { href: '/saved-searches', icon: BookmarkCheck, label: 'Saved Searches', description: '5 active searches' },
                { href: '/compare', icon: BarChart3, label: 'Compare', description: 'Compare up to 4 properties' },
                { href: '/analytics', icon: TrendingUp, label: 'Market Analytics', description: 'View market trends' },
              ].map(({ href, icon: Icon, label, description }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">{label}</div>
                    <div className="text-xs text-neutral-500">{description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Snapshot */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Market Snapshot</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/analytics">View Full Report</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Median Home Price', value: '$485,000', change: '+3.2% MoM' },
                { label: 'Avg Days on Market', value: '28 days', change: '-4 days MoM' },
                { label: 'New Listings (30d)', value: '1,247', change: '+8.5% MoM' },
                { label: 'Sale/List Price Ratio', value: '98.3%', change: '+0.5% MoM' },
              ].map(({ label, value, change }) => (
                <div
                  key={label}
                  className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800"
                >
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
                  <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">
                    {value}
                  </div>
                  <div className="mt-0.5 text-xs text-success-600 dark:text-success-400">
                    {change}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <strong>Market Update:</strong> The market remains competitive with inventory still
                below historical norms. Buyers should be prepared for multiple offers in popular
                neighborhoods.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Properties */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Recommended For You
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/properties">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((i) => <PropertyCardSkeleton key={i} />)
            : properties?.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </div>
      </div>
    </div>
  );
}
