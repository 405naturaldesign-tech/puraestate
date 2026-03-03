import { router } from '../trpc';
import { listingsRouter } from './listings';
import { inquiriesRouter } from './inquiries';
import { composioEventsRouter } from './composio-events';

/**
 * Main app router combining all sub-routers
 */
export const appRouter = router({
  listings: listingsRouter,
  inquiries: inquiriesRouter,
  composioEvents: composioEventsRouter,
});

/**
 * Export type definition for client
 */
export type AppRouter = typeof appRouter;
