import { WifiOff } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 dark:bg-neutral-950">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
            <WifiOff className="h-10 w-10 text-neutral-400" />
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
          You&apos;re Offline
        </h1>
        <p className="mb-8 text-neutral-500 dark:text-neutral-400">
          PuraEstate requires an internet connection to show the latest listings. Please check your
          connection and try again.
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>
  );
}
