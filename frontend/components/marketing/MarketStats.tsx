import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react';

const stats = [
  {
    icon: Building2,
    value: '50,000+',
    label: 'Active Listings',
    description: 'Properties across all categories',
    color: 'text-primary-600',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    icon: Users,
    value: '12,500+',
    label: 'Verified Agents',
    description: 'Ready to help you find your home',
    color: 'text-success-600',
    bg: 'bg-success-50 dark:bg-success-900/20',
  },
  {
    icon: DollarSign,
    value: '$4.2B+',
    label: 'Transactions',
    description: 'Successfully closed deals',
    color: 'text-accent-600',
    bg: 'bg-accent-50 dark:bg-accent-900/20',
  },
  {
    icon: TrendingUp,
    value: '98%',
    label: 'Satisfaction Rate',
    description: 'Happy buyers and sellers',
    color: 'text-danger-600',
    bg: 'bg-danger-50 dark:bg-danger-900/20',
  },
];

export function MarketStats() {
  return (
    <section className="border-b border-neutral-200 bg-white py-16 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container-app">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, description, color, bg }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
              <div className="mt-1 font-medium text-neutral-900 dark:text-white">{label}</div>
              <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
