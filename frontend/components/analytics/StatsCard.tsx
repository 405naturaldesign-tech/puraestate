import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}

const colorConfig = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'text-primary-600 dark:text-primary-400',
    value: 'text-primary-600 dark:text-primary-400',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'text-success-600 dark:text-success-400',
    value: 'text-success-600 dark:text-success-400',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    icon: 'text-warning-600 dark:text-warning-400',
    value: 'text-warning-600 dark:text-warning-400',
  },
  danger: {
    bg: 'bg-danger-50 dark:bg-danger-900/20',
    icon: 'text-danger-600 dark:text-danger-400',
    value: 'text-danger-600 dark:text-danger-400',
  },
  accent: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    icon: 'text-accent-600 dark:text-accent-400',
    value: 'text-accent-600 dark:text-accent-400',
  },
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  color = 'primary',
}: StatsCardProps) {
  const colors = colorConfig[color];
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
            <p className={cn('mt-2 text-3xl font-bold', colors.value)}>{value}</p>
            {change !== undefined && (
              <div
                className={cn(
                  'mt-2 flex items-center gap-1 text-sm',
                  isPositive
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{Math.abs(change)}%</span>
                {changeLabel && <span className="text-neutral-400">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn('rounded-xl p-3', colors.bg)}>
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
