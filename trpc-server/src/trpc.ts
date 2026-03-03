import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { ZodError } from 'zod';

/**
 * Context passed to tRPC procedures
 */
export interface Context {
  userId?: string;
  userRole?: 'admin' | 'agent' | 'buyer' | 'seller' | 'viewer';
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
}

/**
 * Create tRPC context from Express request/response
 */
export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<Context> {
  // Extract JWT from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');

  let userId: string | undefined;
  let userRole: Context['userRole'];

  if (token) {
    try {
      // Verify token with Flask backend
      const flaskResponse = await fetch(`${process.env.FLASK_API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (flaskResponse.ok) {
        const data = await flaskResponse.json();
        userId = data.user_id;
        userRole = data.role || 'viewer';
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }

  return {
    userId,
    userRole,
    req,
    res,
  };
}

/**
 * Initialize tRPC
 */
export const t = initTRPC.context<typeof createContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create protected procedure (requires authentication)
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }
  return opts.next();
});

/**
 * Create admin procedure (requires admin role)
 */
export const adminProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }
  if (opts.ctx.userRole !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return opts.next();
});

/**
 * Create public procedure (no authentication required)
 */
export const publicProcedure = t.procedure;

/**
 * Create API key protected procedure (requires either JWT or API key)
 */
export const apiKeyOrProtectedProcedure = t.procedure.use(async (opts) => {
  const authHeader = opts.ctx.req.headers.authorization;
  const apiKeyHeader = opts.ctx.req.headers['x-api-key'];

  // Check if JWT is valid (userId would be set by createContext)
  if (opts.ctx.userId) {
    return opts.next();
  }

  // Check if API key is valid
  if (apiKeyHeader && apiKeyHeader === process.env.COMPOSIO_API_KEY) {
    return opts.next();
  }

  // Neither JWT nor API key is valid
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'Not authenticated',
  });
});

/**
 * Create router
 */
export const router = t.router;
