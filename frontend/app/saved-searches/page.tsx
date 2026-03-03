'use client';

import { useState } from 'react';

import { Bell, BellOff, BookmarkCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { savedSearchesApi } from '@/lib/api/saved-searches';
import { buildSearchUrl } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SavedSearchesPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => savedSearchesApi.getAll(),
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      savedSearchesApi.toggleAlert(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => savedSearchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      setDeleteId(null);
      toast.success('Search deleted');
    },
  });

  const savedSearches = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Saved Searches</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Manage your saved searches and notification alerts
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : savedSearches.length === 0 ? (
          <div className="py-24 text-center">
            <BookmarkCheck className="mx-auto mb-4 h-16 w-16 text-neutral-200 dark:text-neutral-700" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              No Saved Searches
            </h2>
            <p className="mt-2 text-neutral-500">
              Save your search criteria to get alerts when new matching properties are listed
            </p>
            <Button className="mt-6" asChild>
              <Link href="/search">Start Searching</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <Card key={search.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">
                          {search.name}
                        </h3>
                        {search.alert_enabled && (
                          <Badge variant="success" dot>
                            Active alerts
                          </Badge>
                        )}
                        {search.new_results_count && search.new_results_count > 0 && (
                          <Badge variant="primary">
                            {search.new_results_count} new
                          </Badge>
                        )}
                      </div>

                      {/* Filter summary */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {search.filters.listing_type && (
                          <span className="feature-chip capitalize">{search.filters.listing_type}</span>
                        )}
                        {search.filters.property_type?.map((t) => (
                          <span key={t} className="feature-chip capitalize">{t}</span>
                        ))}
                        {(search.filters.price_min || search.filters.price_max) && (
                          <span className="feature-chip">
                            ${search.filters.price_min?.toLocaleString() || '0'} – ${search.filters.price_max?.toLocaleString() || 'Any'}
                          </span>
                        )}
                        {search.filters.city && (
                          <span className="feature-chip">{search.filters.city}</span>
                        )}
                        {search.filters.bedrooms_min && (
                          <span className="feature-chip">{search.filters.bedrooms_min}+ beds</span>
                        )}
                      </div>

                      {search.alert_enabled && (
                        <p className="mt-2 text-xs text-neutral-500">
                          Alerts: {search.alert_frequency} •{' '}
                          {search.last_alert_at
                            ? `Last sent: ${new Date(search.last_alert_at).toLocaleDateString()}`
                            : 'No alerts sent yet'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={search.alert_enabled ? 'success' : 'outline'}
                        size="sm"
                        onClick={() =>
                          toggleAlertMutation.mutate({
                            id: search.id,
                            enabled: !search.alert_enabled,
                          })
                        }
                        title={search.alert_enabled ? 'Disable alerts' : 'Enable alerts'}
                      >
                        {search.alert_enabled ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </Button>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties${buildSearchUrl(search.filters as Record<string, unknown>)}`}>
                          View Results
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(search.id)}
                        className="text-neutral-400 hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Saved Search"
        message="Are you sure you want to delete this saved search? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
