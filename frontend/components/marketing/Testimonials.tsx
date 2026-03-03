import { Quote, Star } from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

const testimonials = [
  {
    id: 1,
    name: 'Jennifer & Mark Williams',
    role: 'First-time Homebuyers',
    rating: 5,
    text: 'PuraEstate made finding our first home so much easier. The comparison tool helped us evaluate multiple properties side by side, and we found the perfect house within our budget!',
  },
  {
    id: 2,
    name: 'David Park',
    role: 'Real Estate Investor',
    rating: 5,
    text: 'The ROI calculator and market analytics are invaluable. I\'ve made three successful investment purchases using PuraEstate\'s data. The map view is fantastic for neighborhood research.',
  },
  {
    id: 3,
    name: 'Sandra Martinez',
    role: 'Property Seller',
    rating: 5,
    text: 'Listed my condo and got 12 qualified inquiries in the first week. The professional photo tools and detailed listing pages really make properties stand out. Sold above asking price!',
  },
];

export function Testimonials() {
  return (
    <section className="bg-neutral-50 py-16 dark:bg-neutral-900 md:py-24">
      <div className="container-app">
        <div className="mb-12 text-center">
          <h2 className="section-heading">What Our Users Say</h2>
          <p className="section-subheading">
            Join thousands of satisfied homebuyers, sellers, and investors
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.id} variant="default">
              <Quote className="mb-4 h-8 w-8 text-primary-200 dark:text-primary-800" />
              <p className="mb-6 text-neutral-600 dark:text-neutral-300">{t.text}</p>
              <div className="flex items-center gap-3">
                <Avatar name={t.name} size="md" />
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white">{t.name}</div>
                  <div className="text-sm text-neutral-500">{t.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
