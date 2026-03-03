'use client';

import { useState } from 'react';

import { Building2, MessageCircle, Phone, Search, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { agentsApi } from '@/lib/api/agents';
import { useQuery } from '@tanstack/react-query';

const specializations = [
  { value: '', label: 'All Specializations' },
  { value: 'luxury', label: 'Luxury Homes' },
  { value: 'investment', label: 'Investment Properties' },
  { value: 'first-time', label: 'First-Time Buyers' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'relocation', label: 'Relocation' },
];

const sortOptions = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'sales_count', label: 'Most Sales' },
  { value: 'listings_count', label: 'Most Listings' },
  { value: 'years_experience', label: 'Most Experience' },
];

export function AgentsContent() {
  const [query, setQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const { data, isLoading } = useQuery({
    queryKey: ['agents', { query, specialization, sortBy }],
    queryFn: () =>
      agentsApi.getAll({
        query: query || undefined,
        specialization: specialization || undefined,
        sort_by: sortBy as 'rating' | 'listings_count' | 'sales_count' | 'years_experience',
        per_page: 12,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const agents = data?.data || [];

  return (
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Find an Agent</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Connect with verified real estate professionals in your area
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <Input
          label="Search Agents"
          placeholder="Name, city, or agency..."
          leftIcon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          containerClassName="flex-1 min-w-48"
        />
        <Select
          label="Specialization"
          options={specializations}
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          containerClassName="w-48"
        />
        <Select
          label="Sort by"
          options={sortOptions}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          containerClassName="w-48"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-neutral-500">No agents found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} hover>
              <CardContent>
                {/* Agent header */}
                <div className="flex items-start gap-4">
                  <Avatar name={agent.full_name} src={agent.avatar_url} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {agent.full_name}
                      </h3>
                      {agent.agent_profile?.verified && (
                        <ShieldCheck className="h-4 w-4 shrink-0 text-primary-500" />
                      )}
                    </div>
                    {agent.agent_profile?.agency_name && (
                      <p className="text-sm text-neutral-500 truncate">
                        {agent.agent_profile.agency_name}
                      </p>
                    )}
                    {agent.agent_profile?.rating && (
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {agent.agent_profile.rating}
                        </span>
                        <span className="text-xs text-neutral-500">
                          ({agent.agent_profile.reviews_count})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {agent.agent_profile && (
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                    <div className="text-center">
                      <div className="font-bold text-primary-600">{agent.agent_profile.listings_count}</div>
                      <div className="text-xs text-neutral-500">Listings</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary-600">{agent.agent_profile.sales_count}</div>
                      <div className="text-xs text-neutral-500">Sales</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-primary-600">{agent.agent_profile.years_experience}yr</div>
                      <div className="text-xs text-neutral-500">Experience</div>
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {agent.agent_profile?.specializations?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {agent.agent_profile.specializations.slice(0, 3).map((s) => (
                      <Badge key={s} variant="default" size="sm">{s}</Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/agents/${agent.id}`}>View Profile</Link>
                  </Button>
                  {agent.phone && (
                    <Button variant="outline" size="icon-sm" asChild>
                      <a href={`tel:${agent.phone}`} aria-label="Call agent">
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="primary" size="icon-sm">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={!data.has_prev}>Previous</Button>
          <span className="flex items-center px-4 text-sm text-neutral-600">
            Page {data.page} of {data.total_pages}
          </span>
          <Button variant="outline" size="sm" disabled={!data.has_next}>Next</Button>
        </div>
      )}
    </div>
  );
}
