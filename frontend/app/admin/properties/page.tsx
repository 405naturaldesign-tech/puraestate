'use client';

import { useState } from 'react';

import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pending-properties-list', page],
    queryFn: () => adminApi.getPendingProperties({ page, per_page: 15 }),
    staleTime: 30 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-properties-list'] });
      toast.success('Property approved and published');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectProperty(id, 'Does not meet listing guidelines'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-properties-list'] });
      setRejectTarget(null);
      toast.success('Property rejected');
    },
  });

  const properties = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Property Moderation
          </h1>
          <p className="mt-1 text-neutral-500">
            {data ? `${data.total} listings pending review` : 'Loading...'}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="py-24 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-success-400" />
            <h2 className="mt-4 text-xl font-semibold text-neutral-900 dark:text-white">
              All Caught Up!
            </h2>
            <p className="mt-2 text-neutral-500">No properties pending review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <Card key={property.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {property.title}
                        </h3>
                        <Badge variant="warning">Pending Review</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-neutral-500">
                        <span>{property.address.city}, {property.address.state}</span>
                        <span>{formatCurrency(property.price)}</span>
                        <span>Listed by: {property.agent?.full_name}</span>
                        <span>{formatDate(property.created_at)}</span>
                      </div>
                      <div className="mt-2 line-clamp-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {property.description}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => approveMutation.mutate(property.id)}
                        isLoading={approveMutation.isPending}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger-outline"
                        size="sm"
                        onClick={() => setRejectTarget(property.id)}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data && data.total_pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_prev}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              {page} / {data.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => rejectTarget && rejectMutation.mutate(rejectTarget)}
        title="Reject Property"
        message="Are you sure you want to reject this listing? The agent will be notified."
        confirmText="Reject"
        isLoading={rejectMutation.isPending}
      />
    </DashboardLayout>
  );
}
