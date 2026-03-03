import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-neutral-950">
      <div className="text-center">
        <div className="mb-6 text-8xl font-black text-primary-200 dark:text-primary-900">404</div>
        <h1 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="mb-8 max-w-md text-neutral-500 dark:text-neutral-400">
          Sorry, we couldn&apos;t find the page you were looking for. It may have been moved or
          deleted.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/properties">Browse Properties</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
