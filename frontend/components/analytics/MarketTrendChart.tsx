'use client';

import { useState } from 'react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency } from '@/lib/utils';

const periods = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
  { value: '5y', label: '5Y' },
];

type ChartType = 'price' | 'volume' | 'days_on_market';

export function MarketTrendChart() {
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y' | '2y' | '5y'>('1y');
  const [chartType, setChartType] = useState<ChartType>('price');

  const { data: trends, isLoading } = useQuery({
    queryKey: ['market-trends', period],
    queryFn: () => analyticsApi.getMarketTrends(period),
    staleTime: 5 * 60 * 1000,
  });

  const chartData = trends?.map((t) => ({
    date: t.date,
    'Avg Price': t.avg_price,
    'Median Price': t.median_price,
    'Listings': t.listings_count,
    'Sold': t.sold_count,
    'Days on Market': t.days_on_market,
    'Price/sqft': t.price_per_sqft,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Market Trends</CardTitle>
          <div className="flex flex-wrap gap-2">
            {/* Chart type */}
            <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700">
              {(['price', 'volume', 'days_on_market'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    chartType === type
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  } first:rounded-l-lg last:rounded-r-lg`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Period selector */}
            <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as typeof period)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.value
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  } first:rounded-l-lg last:rounded-r-lg`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="skeleton h-64 w-full rounded-lg" />
        ) : chartType === 'price' ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="avgPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="medPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="Avg Price" stroke="#2563eb" strokeWidth={2} fill="url(#avgPriceGrad)" />
              <Area type="monotone" dataKey="Median Price" stroke="#f59e0b" strokeWidth={2} fill="url(#medPriceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : chartType === 'volume' ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
              <Legend />
              <Bar dataKey="Listings" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sold" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="domGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => `${value} days`}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              />
              <Area type="monotone" dataKey="Days on Market" stroke="#ef4444" strokeWidth={2} fill="url(#domGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
