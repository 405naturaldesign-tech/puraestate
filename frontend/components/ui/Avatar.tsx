import Image from 'next/image';

import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'away';
}

const sizeConfig = {
  xs: { container: 'h-6 w-6', text: 'text-2xs', status: 'h-1.5 w-1.5' },
  sm: { container: 'h-8 w-8', text: 'text-xs', status: 'h-2 w-2' },
  md: { container: 'h-10 w-10', text: 'text-sm', status: 'h-2.5 w-2.5' },
  lg: { container: 'h-12 w-12', text: 'text-base', status: 'h-3 w-3' },
  xl: { container: 'h-16 w-16', text: 'text-lg', status: 'h-3.5 w-3.5' },
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  away: 'bg-warning-500',
};

export function Avatar({ src, name, size = 'md', className, status }: AvatarProps) {
  const { container, text, status: statusSize } = sizeConfig[size];
  const initials = name ? getInitials(name) : '?';

  return (
    <div className={cn('relative inline-flex shrink-0', container, className)}>
      {src ? (
        <Image
          src={src}
          alt={name || 'Avatar'}
          fill
          className="rounded-full object-cover"
          sizes="64px"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-semibold text-white',
            text
          )}
          aria-label={name}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-neutral-900',
            statusSize,
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
