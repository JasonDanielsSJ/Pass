import { FastifyInstance } from 'fastify';
import { prisma } from '@voltpass/db';
import { requireAuth } from '../middleware/auth';
import { checkCompliance, ActiveCredential } from '@voltpass/compliance';

export async function employerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * POST /employer/batch-verify
   * Accept a CSV of credential IDs (or license numbers) and return a compliance report.
   */
  app.post<{ Body: { credentialIds: string[]; targetState?: string } }>(
    '/batch-verify',
    {
      schema: {
        tags: ['Employer'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['credentialIds'],
          properties: {
            credentialIds: { type: 'array', items: { type: 'string' } },
            targetState: { type: 'string', minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    async (request, reply) => {
      const { credentialIds, targetState } = request.body;

      const results = await Promise.all(
        credentialIds.map(async (id) => {
          const credential = await prisma.credential.findUnique({
            where: { id },
            select: {
              id: true,
              licenseNumber: true,
              issuingState: true,
              licenseType: true,
              tradeLevel: true,
              expiryDate: true,
              status: true,
              user: { select: { name: true, email: true } },
            },
          });

          if (!credential) return { credentialId: id, found: false };

          const now = new Date();
          const expired = new Date(credential.expiryDate) < now;
          const outcome = expired ? 'expired' : credential.status === 'active' ? 'pass' : 'fail';

          let complianceVerdict: string | undefined;
          if (targetState && !expired && credential.status === 'active') {
            const rules = await prisma.reciprocityRule.findMany({
              where: { homeState: credential.issuingState, targetState, tradeLevel: credential.tradeLevel },
            });
            if (rules.length > 0) {
              const topRule = rules[0];
              complianceVerdict = topRule.status === 'full' ? 'compliant' : topRule.status === 'partial' ? 'partial' : 'ineligible';
            } else {
              complianceVerdict = 'ineligible';
            }
          }

          return {
            credentialId: credential.id,
            found: true,
            holderName: credential.user.name,
            licenseNumber: credential.licenseNumber,
            issuingState: credential.issuingState,
            licenseType: credential.licenseType,
            tradeLevel: credential.tradeLevel,
            expiryDate: credential.expiryDate,
            status: credential.status,
            outcome,
            complianceVerdict,
          };
        })
      );

      return reply.send({ data: results });
    }
  );

  /**
   * GET /employer/crew
   * List all workers + compliance status for a given target state.
   */
  app.get<{ Querystring: { targetState?: string; page?: number; pageSize?: number } }>(
    '/crew',
    { schema: { tags: ['Employer'], security: [{ bearerAuth: [] }] } },
    async (request) => {
      const { targetState, page = 1, pageSize = 50 } = request.query;

      // In a real system, employer would have a crew roster; for MVP we return all credentials
      const credentials = await prisma.credential.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { expiryDate: 'asc' },
        select: {
          id: true,
          licenseNumber: true,
          issuingState: true,
          licenseType: true,
          tradeLevel: true,
          expiryDate: true,
          status: true,
          lastVerifiedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      const total = await prisma.credential.count();

      // Enrich with compliance verdict if targetState provided
      const enriched = await Promise.all(
        credentials.map(async (c) => {
          let complianceVerdict: string | undefined;
          if (targetState) {
            const rule = await prisma.reciprocityRule.findFirst({
              where: { homeState: c.issuingState, targetState, tradeLevel: c.tradeLevel },
            });
            complianceVerdict = rule
              ? rule.status === 'full' ? 'compliant' : rule.status === 'partial' ? 'partial' : 'ineligible'
              : 'ineligible';
          }
          return { ...c, complianceVerdict };
        })
      );

      return { data: enriched, total, page, pageSize };
    }
  );

  /**
   * POST /employer/webhooks
   * Register a webhook URL to receive compliance events.
   */
  app.post<{ Body: { webhookUrl: string } }>(
    '/webhooks',
    { schema: { tags: ['Employer'], security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { webhookUrl } = request.body;
      const employer = await prisma.employer.findFirst({ where: { email: request.user.email } });
      if (!employer) return reply.status(404).send({ error: 'Employer account not found' });

      await prisma.employer.update({ where: { id: employer.id }, data: { webhookUrl } });
      return reply.send({ message: 'Webhook registered', webhookUrl });
    }
  );
}
