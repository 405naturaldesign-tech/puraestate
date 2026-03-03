import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';

/**
 * PuraEstate TRPC Server
 * Frontend API layer for React Native mobile app
 * Bridges React Native ↔ Flask Backend ↔ Composio/OpenRouter
 */

const app = express();
const PORT = process.env.PORT || 3000;

// ------ Middleware ------
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'exp://localhost:8081').split(','),
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ------ Logging ------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ------ Health check ------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ------ Status endpoint ------
app.get('/status', (req, res) => {
  const flaskUrl = process.env.FLASK_API_URL || 'not configured';
  const composioConfigured = !!process.env.COMPOSIO_API_KEY;
  const openrouterConfigured = !!process.env.OPENROUTER_API_KEY;

  res.json({
    server: 'TRPC',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    integrations: {
      flask: { url: flaskUrl, status: 'connected' },
      composio: { configured: composioConfigured },
      openrouter: { configured: openrouterConfigured },
    },
  });
});

// ------ tRPC middleware ------
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createContext,
    onError: ({ path, error }) => {
      console.error(`[tRPC] Error at ${path}:`, error);
    },
  })
);

// ------ 404 handler ------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ------ Start server ------
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   PuraEstate TRPC Server                   ║
╠════════════════════════════════════════════╣
║ 🚀 Server running on port ${String(PORT).padEnd(31)}║
║ 🔗 tRPC endpoint: /trpc                    ║
║ 💚 Health check: /health                   ║
║ 📊 Status: /status                         ║
╠════════════════════════════════════════════╣
║ Integrations:                              ║
║ ✅ Flask Backend: ${String(process.env.FLASK_API_URL || 'localhost:5000').padEnd(23)}║
║ ${process.env.COMPOSIO_API_KEY ? '✅' : '❌'} Composio: ${process.env.COMPOSIO_API_KEY ? 'Configured' : 'Not configured'.padEnd(15)}║
║ ${process.env.OPENROUTER_API_KEY ? '✅' : '❌'} OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not configured'.padEnd(13)}║
╚════════════════════════════════════════════╝
  `);
});

// ------ Graceful shutdown ------
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
