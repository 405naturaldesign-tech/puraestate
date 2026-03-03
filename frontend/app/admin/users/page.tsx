'use client';

import { useState } from 'react';

import {
  AlertTriangle,
  CheckCircle,
  Search,
  Shield,
  Trash2,
  UserX,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [banTarget, setBanTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, query, role: roleFilter }],
    queryFn: () =>
      adminApi.getUsers({
        page,
        per_page: 20,
        query: query || undefined,
        role: roleFilter || undefined,
      }),
    staleTime: 30 * 1000,
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id, 'Violated terms of service'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setBanTarget(null);
      toast.success('User banned');
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminApi.verifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User verified');
    },
  });

  const users = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">User Management</h1>
            <p className="mt-1 text-neutral-500">
              {data ? `${data.total.toLocaleString()} total users` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search users..."
                  className="search-input pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="form-input w-36"
              >
                <option value="">All Roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="agent">Agents</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="skeleton h-4 w-full rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-900 dark:text-white">
                                  {user.full_name}
                                </span>
                                {user.is_verified && (
                                  <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                                )}
                              </div>
                              <div className="text-xs text-neutral-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              user.role === 'admin' ? 'danger' :
                              user.role === 'agent' ? 'primary' :
                              user.role === 'moderator' ? 'warning' : 'default'
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.is_active ? 'success' : 'danger'} dot>
                            {user.is_active ? 'Active' : 'Banned'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {!user.is_verified && (
                              <Button
                                variant="success"
                                size="xs"
                                onClick={() => verifyMutation.mutate(user.id)}
                                title="Verify user"
                              >
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {user.is_active ? (
                              <Button
                                variant="danger-outline"
                                size="xs"
                                onClick={() => setBanTarget(user.id)}
                                title="Ban user"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Ban
                              </Button>
                            ) : (
                              <Button
                                variant="success"
                                size="xs"
                                title="Unban user"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Unban
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
              <span className="text-sm text-neutral-500">
                Page {page} of {data.total_pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.has_prev}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.has_next}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={() => banTarget && banMutation.mutate(banTarget)}
        title="Ban User"
        message="Are you sure you want to ban this user? They will lose access to the platform."
        confirmText="Ban User"
        isLoading={banMutation.isPending}
      />
    </DashboardLayout>
  );
}
