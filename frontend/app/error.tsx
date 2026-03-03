'use client';

import { useEffect } from 'react';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-neutral-950">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger-50 dark:bg-danger-900/20">
            <AlertTriangle className="h-10 w-10 text-danger-500" />
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mb-8 text-neutral-500 dark:text-neutral-400">
          We encountered an unexpected error. Please try again or contact support if the problem
          persists.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 rounded-lg bg-neutral-100 p-4 text-left dark:bg-neutral-800">
            <summary className="cursor-pointer text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Error Details
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-danger-600">{error.message}</pre>
          </details>
        )}
        <div className="flex justify-center gap-4">
          <Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
