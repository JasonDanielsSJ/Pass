import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { authRoutes } from './routes/auth';
import { credentialRoutes } from './routes/credentials';
import { complianceRoutes } from './routes/compliance';
import { verifyRoutes } from './routes/verify';
import { employerRoutes } from './routes/employer';
import { stripeRoutes } from './routes/stripe';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
});

async function start() {
  // ── Plugins ─────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production',
    sign: { expiresIn: '7d' },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'VoltPass API',
        description: 'Portable digital credential wallet for licensed electricians',
        version: '1.0.0',
      },
      servers: [{ url: process.env.API_URL ?? 'http://localhost:3001' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(credentialRoutes, { prefix: '/credentials' });
  await app.register(complianceRoutes, { prefix: '/compliance' });
  await app.register(verifyRoutes, { prefix: '/verify' });
  await app.register(employerRoutes, { prefix: '/employer' });
  await app.register(stripeRoutes, { prefix: '/stripe' });

  // ── Health check ──────────────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ── Start server ──────────────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`VoltPass API listening on port ${port}`);
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});

export default app;
