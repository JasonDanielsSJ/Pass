import { FastifyInstance } from 'fastify';
import { prisma } from '@voltpass/db';
import { requireAuth, enforcePlanLimits } from '../middleware/auth';
import { checkCompliance, ActiveCredential, ReciprocityRule, StateRequirement } from '@voltpass/compliance';
import { createClient } from 'ioredis';

let redis: ReturnType<typeof createClient> | null = null;
try {
  redis = new (require('ioredis'))({ url: process.env.REDIS_URL ?? 'redis://localhost:6379', lazyConnect: true });
} catch { /* Redis optional in dev */ }

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function complianceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * POST /compliance/check
   */
  app.post<{ Body: { targetState: string; tradeLevel: string } }>(
    '/check',
    {
      schema: {
        tags: ['Compliance'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['targetState', 'tradeLevel'],
          properties: {
            targetState: { type: 'string', minLength: 2, maxLength: 2 },
            tradeLevel: { type: 'string', enum: ['apprentice', 'journeyman', 'master', 'contractor'] },
          },
        },
      },
    },
    async (request, reply) => {
      const limitCheck = await enforcePlanLimits(request as any, reply, 'compliance');
      if (limitCheck) return;

      const { targetState, tradeLevel } = request.body;
      const userId = request.user.userId;
      const cacheKey = `compliance:${userId}:${targetState}:${tradeLevel}`;

      // Check Redis cache
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) return reply.send({ data: JSON.parse(cached), cached: true });
        } catch { /* ignore cache errors */ }
      }

      // Fetch active credentials
      const dbCreds = await prisma.credential.findMany({
        where: { userId, status: 'active' },
      });

      const now = new Date();
      const credentials: ActiveCredential[] = dbCreds
        .filter(c => new Date(c.expiryDate) > now)
        .map(c => ({
          licenseNumber: c.licenseNumber,
          issuingState: c.issuingState,
          licenseType: c.licenseType,
          tradeLevel: c.tradeLevel as any,
          expiryDate: new Date(c.expiryDate),
          status: 'active' as const,
        }));

      // Fetch reciprocity rules
      const homeStates = [...new Set(credentials.map(c => c.issuingState))];
      const dbRules = await prisma.reciprocityRule.findMany({
        where: {
          homeState: { in: homeStates },
          targetState,
          tradeLevel,
        },
      });

      const rules: ReciprocityRule[] = dbRules.map(r => ({
        homeState: r.homeState,
        targetState: r.targetState,
        tradeLevel: r.tradeLevel as any,
        status: r.status as 'full' | 'partial' | 'none',
        conditions: r.conditions ? (r.conditions as string[]) : undefined,
      }));

      // Collect all requirement IDs referenced by partial rules
      const reqIds = rules
        .filter(r => r.status === 'partial' && r.conditions)
        .flatMap(r => r.conditions!);

      const dbReqs = reqIds.length
        ? await prisma.stateRequirement.findMany({ where: { id: { in: reqIds } } })
        : [];

      const requirementsMap = new Map<string, StateRequirement>(
        dbReqs.map(r => [
          r.id,
          {
            id: r.id,
            name: r.name,
            requirementType: r.requirementType,
            description: r.description ?? undefined,
            feeAmount: r.feeAmount ? Number(r.feeAmount) : undefined,
            processingDays: r.processingDays ?? undefined,
            formUrl: r.formUrl ?? undefined,
          },
        ])
      );

      const result = checkCompliance(credentials, targetState, tradeLevel as any, rules, requirementsMap);

      // Persist check
      await prisma.complianceCheck.create({
        data: {
          userId,
          targetState,
          tradeType: 'electrician',
          verdict: result.verdict,
          gapSteps: result.gapSteps ?? [],
        },
      });

      // Cache result
      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
        } catch { /* ignore */ }
      }

      return reply.send({ data: result });
    }
  );
}
