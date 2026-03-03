'use client';

import { BarChart3, Building2, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { MarketTrendChart } from '@/components/analytics/MarketTrendChart';
import { StatsCard } from '@/components/analytics/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency, formatCompact } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const COLORS = ['#2563eb', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'];

export function AnalyticsContent() {
  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: priceDistribution } = useQuery({
    queryKey: ['price-distribution'],
    queryFn: () => analyticsApi.getPriceDistribution(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: topCities } = useQuery({
    queryKey: ['top-cities'],
    queryFn: () => analyticsApi.getTopCities(),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Market Analytics</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Real-time insights into property markets and trends
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          icon={Building2}
          label="Total Listings"
          value={summary ? formatCompact(summary.total_properties) : '—'}
          change={5.2}
          changeLabel="MoM"
          color="primary"
        />
        <StatsCard
          icon={Users}
          label="Active Users"
          value={summary ? formatCompact(summary.total_users) : '—'}
          change={12.1}
          changeLabel="MoM"
          color="success"
        />
        <StatsCard
          icon={TrendingUp}
          label="Avg Price"
          value={summary ? formatCurrency(summary.avg_price, 'USD', 'en-US', true) : '—'}
          change={3.8}
          changeLabel="MoM"
          color="accent"
        />
        <StatsCard
          icon={DollarSign}
          label="Revenue"
          value={summary ? formatCurrency(summary.revenue_this_month, 'USD', 'en-US', true) : '—'}
          change={8.4}
          changeLabel="vs last month"
          color="warning"
        />
        <StatsCard
          icon={Clock}
          label="Avg Days Listed"
          value={summary ? `${summary.avg_days_on_market}d` : '—'}
          change={-12.5}
          changeLabel="MoM"
          color="danger"
        />
        <StatsCard
          icon={BarChart3}
          label="Conversion Rate"
          value={summary ? `${(summary.conversion_rate * 100).toFixed(1)}%` : '—'}
          change={1.2}
          changeLabel="MoM"
          color="primary"
        />
      </div>

      {/* Market Trend Chart */}
      <MarketTrendChart />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {priceDistribution ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="skeleton h-64 w-full rounded-lg" />
            )}
          </CardContent>
        </Card>

        {/* Property Types */}
        <Card>
          <CardHeader>
            <CardTitle>Listings by Property Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Houses', value: 35 },
                    { name: 'Apartments', value: 28 },
                    { name: 'Condos', value: 18 },
                    { name: 'Townhouses', value: 12 },
                    { name: 'Other', value: 7 },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={index} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Share']}
                  contentStyle={{ borderRadius: '12px', fontSize: '13px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Cities */}
      {topCities && (
        <Card>
          <CardHeader>
            <CardTitle>Top Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {topCities.slice(0, 5).map(
                (
                  city: { name: string; avg_price: number; listings: number; change: number },
                  i: number
                ) => (
                  <div key={city.name} className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                    <div className="mb-1 text-xs text-neutral-500">#{i + 1}</div>
                    <div className="font-semibold text-neutral-900 dark:text-white">{city.name}</div>
                    <div className="mt-1 text-sm text-primary-600">{formatCurrency(city.avg_price, 'USD', 'en-US', true)}</div>
                    <div className="mt-0.5 text-xs text-neutral-500">{city.listings.toLocaleString()} listings</div>
                    <div
                      className={`mt-1 text-xs ${
                        city.change >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {city.change >= 0 ? '+' : ''}{city.change}% MoM
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
