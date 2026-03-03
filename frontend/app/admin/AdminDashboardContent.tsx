'use client';

import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { StatsCard } from '@/components/analytics/StatsCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { adminApi } from '@/lib/api/admin';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function AdminDashboardContent() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 60 * 1000,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pending-properties'],
    queryFn: () => adminApi.getPendingProperties({ per_page: 5 }),
    staleTime: 30 * 1000,
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-users', { per_page: 5 }],
    queryFn: () => adminApi.getUsers({ per_page: 5 }),
    staleTime: 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Property approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectProperty(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-properties'] });
      toast.success('Property rejected');
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>
        </div>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Platform overview and moderation tools
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Users}
          label="Total Users"
          value={stats?.total_users?.toLocaleString() || '—'}
          change={stats?.new_users_this_month}
          changeLabel="new this month"
          color="primary"
        />
        <StatsCard
          icon={Building2}
          label="Total Listings"
          value={stats?.total_properties?.toLocaleString() || '—'}
          color="success"
        />
        <StatsCard
          icon={Clock}
          label="Pending Review"
          value={pendingData?.total || '—'}
          color="warning"
        />
        <StatsCard
          icon={BarChart3}
          label="Revenue (MTD)"
          value={stats?.revenue ? formatCurrency(stats.revenue, 'USD', 'en-US', true) : '—'}
          change={8.2}
          changeLabel="vs last month"
          color="accent"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Moderation</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/properties">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingData?.data?.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-success-400" />
                <p className="mt-2 text-sm text-neutral-500">All caught up! No pending reviews.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingData?.data?.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-neutral-900 dark:text-white truncate">
                        {property.title}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {property.address.city}, {property.address.state} •{' '}
                        {formatDate(property.created_at)}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-primary-600">
                        {formatCurrency(property.price)}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        variant="success"
                        size="xs"
                        onClick={() => approveMutation.mutate(property.id)}
                        isLoading={approveMutation.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        variant="danger-outline"
                        size="xs"
                        onClick={() =>
                          rejectMutation.mutate({
                            id: property.id,
                            reason: 'Does not meet listing guidelines',
                          })
                        }
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Users</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers?.data?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="truncate text-xs text-neutral-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={
                        user.role === 'admin' ? 'danger' :
                        user.role === 'agent' ? 'primary' : 'default'
                      }
                      size="sm"
                    >
                      {user.role}
                    </Badge>
                    {!user.is_active && (
                      <AlertTriangle className="h-4 w-4 text-warning-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Admin Links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: '/admin/users', icon: Users, label: 'User Management', color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { href: '/admin/properties', icon: Building2, label: 'Property Review', color: 'text-success-600', bg: 'bg-success-50 dark:bg-success-900/20' },
          { href: '/analytics', icon: TrendingUp, label: 'Analytics', color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/20' },
          { href: '/admin/settings', icon: Shield, label: 'Settings', color: 'text-neutral-600', bg: 'bg-neutral-100 dark:bg-neutral-800' },
        ].map(({ href, icon: Icon, label, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center rounded-xl border border-neutral-200 p-6 text-center transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <div className={`mb-3 rounded-xl p-3 ${bg}`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
