import { Star } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const featuredAgents = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'Senior Real Estate Agent',
    rating: 4.9,
    reviews: 124,
    listings: 38,
    sales: 215,
    specialties: ['Luxury Homes', 'Downtown'],
    image: null,
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Investment Property Specialist',
    rating: 4.8,
    reviews: 89,
    listings: 52,
    sales: 178,
    specialties: ['Investment', 'Commercial'],
    image: null,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'First-Time Buyer Expert',
    rating: 5.0,
    reviews: 67,
    listings: 24,
    sales: 143,
    specialties: ['First-Time Buyers', 'Suburbs'],
    image: null,
  },
];

export function AgentSection() {
  return (
    <section className="bg-white py-16 dark:bg-neutral-950 md:py-24">
      <div className="container-app">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Meet Our Top Agents</h2>
          <p className="section-subheading mx-auto max-w-2xl">
            Work with experienced, verified real estate professionals who know your market inside
            and out.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredAgents.map((agent) => (
            <Card key={agent.id} hover className="text-center">
              <div className="flex flex-col items-center">
                <Avatar name={agent.name} size="xl" className="mb-4" />
                <h3 className="font-semibold text-neutral-900 dark:text-white">{agent.name}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{agent.title}</p>

                {/* Rating */}
                <div className="mt-3 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {agent.rating}
                  </span>
                  <span className="text-sm text-neutral-500">({agent.reviews} reviews)</span>
                </div>

                {/* Stats */}
                <div className="mt-4 flex w-full justify-around border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <div className="text-center">
                    <div className="font-bold text-primary-600">{agent.listings}</div>
                    <div className="text-xs text-neutral-500">Listings</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-primary-600">{agent.sales}</div>
                    <div className="text-xs text-neutral-500">Sales</div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {agent.specialties.map((s) => (
                    <span
                      key={s}
                      className="feature-chip text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/agents/${agent.id}`}>View Profile</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" asChild>
            <Link href="/agents">Browse All Agents</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
