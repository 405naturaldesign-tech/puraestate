'use client';

import {
  Building2,
  Globe,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Twitter,
} from 'lucide-react';
import Link from 'next/link';

import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { agentsApi } from '@/lib/api/agents';
import { useQuery } from '@tanstack/react-query';

interface PageProps {
  params: { id: string };
}

export default function AgentDetailPage({ params }: PageProps) {
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', params.id],
    queryFn: () => agentsApi.getById(params.id),
  });

  const { data: listings } = useQuery({
    queryKey: ['agent-listings', params.id],
    queryFn: () => agentsApi.getListings(params.id),
    enabled: !!agent,
  });

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="container-app py-8">
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </MarketingLayout>
    );
  }

  if (!agent) {
    return (
      <MarketingLayout>
        <div className="container-app py-24 text-center">
          <h1 className="text-2xl font-bold">Agent not found</h1>
          <Button className="mt-4" asChild>
            <Link href="/agents">Browse Agents</Link>
          </Button>
        </div>
      </MarketingLayout>
    );
  }

  const profile = agent.agent_profile;

  return (
    <MarketingLayout>
      <div className="container-app py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Agent Card - Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardContent>
                <div className="flex flex-col items-center text-center">
                  <Avatar name={agent.full_name} src={agent.avatar_url} size="xl" className="mb-4" />
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                      {agent.full_name}
                    </h1>
                    {profile?.verified && (
                      <ShieldCheck className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                  {profile?.agency_name && (
                    <p className="mt-1 text-neutral-500">{profile.agency_name}</p>
                  )}

                  {profile?.rating && (
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(profile.rating)
                              ? 'fill-accent-400 text-accent-400'
                              : 'fill-neutral-200 text-neutral-200'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium">{profile.rating}</span>
                      <span className="text-sm text-neutral-500">({profile.reviews_count} reviews)</span>
                    </div>
                  )}

                  {/* Stats */}
                  {profile && (
                    <div className="mt-6 grid w-full grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-600">{profile.listings_count}</div>
                        <div className="text-xs text-neutral-500">Listings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-600">{profile.sales_count}</div>
                        <div className="text-xs text-neutral-500">Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-600">{profile.years_experience}yr</div>
                        <div className="text-xs text-neutral-500">Experience</div>
                      </div>
                    </div>
                  )}

                  {/* Contact buttons */}
                  <div className="mt-4 flex w-full gap-2">
                    {agent.phone && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={`tel:${agent.phone}`}>
                          <Phone className="mr-1 h-4 w-4" />
                          Call
                        </a>
                      </Button>
                    )}
                    <Button size="sm" className="flex-1">
                      <MessageCircle className="mr-1 h-4 w-4" />
                      Message
                    </Button>
                  </div>

                  {/* Social links */}
                  {profile?.social_links && (
                    <div className="mt-4 flex justify-center gap-2">
                      {profile.social_links.linkedin && (
                        <a
                          href={profile.social_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600 dark:hover:bg-neutral-800"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {profile.social_links.twitter && (
                        <a
                          href={profile.social_links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600 dark:hover:bg-neutral-800"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {profile?.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600 dark:hover:bg-neutral-800"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      <a
                        href={`mailto:${agent.email}`}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600 dark:hover:bg-neutral-800"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specializations */}
            {profile?.specializations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Specializations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.specializations.map((s) => (
                      <Badge key={s} variant="primary">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {profile?.languages?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((l) => (
                      <Badge key={l} variant="default">{l}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            {profile?.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About {agent.first_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Active Listings */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  Active Listings ({profile?.listings_count || 0})
                </h2>
              </div>

              {listings?.data?.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {listings.data.slice(0, 4).map(
                    (property: Parameters<typeof PropertyCard>[0]['property']) => (
                      <PropertyCard key={property.id} property={property} />
                    )
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500">
                  <Building2 className="mx-auto mb-3 h-12 w-12 text-neutral-200 dark:text-neutral-700" />
                  <p>No active listings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
