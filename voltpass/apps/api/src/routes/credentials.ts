import { FastifyInstance } from 'fastify';
import { prisma } from '@voltpass/db';
import { requireAuth, enforcePlanLimits } from '../middleware/auth';
import { issueVC } from '@voltpass/vc';
import { randomBytes } from 'crypto';
import { AdapterRegistry } from '../scrapers/AdapterRegistry';

export async function credentialRoutes(app: FastifyInstance) {
  // Require auth for all credential routes
  app.addHook('preHandler', requireAuth);

  /**
   * POST /credentials
   * Upload and trigger verification of a new credential.
   */
  app.post<{
    Body: {
      licenseNumber: string;
      issuingState: string;
      licenseType: string;
      tradeLevel: string;
      expiryDate: string;
      verificationMethod?: string;
    };
  }>(
    '/',
    {
      schema: {
        tags: ['Credentials'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['licenseNumber', 'issuingState', 'licenseType', 'tradeLevel', 'expiryDate'],
          properties: {
            licenseNumber: { type: 'string' },
            issuingState: { type: 'string', minLength: 2, maxLength: 2 },
            licenseType: { type: 'string' },
            tradeLevel: { type: 'string', enum: ['apprentice', 'journeyman', 'master', 'contractor'] },
            expiryDate: { type: 'string', format: 'date' },
            verificationMethod: { type: 'string', enum: ['api', 'scrape', 'manual_upload'] },
          },
        },
      },
    },
    async (request, reply) => {
      const planCheck = await enforcePlanLimits(request as any, reply, 'credential');
      if (planCheck) return;

      const { licenseNumber, issuingState, licenseType, tradeLevel, expiryDate, verificationMethod = 'scrape' } = request.body;
      const userId = request.user.userId;

      // Try to verify via adapter
      let status: string = 'pending';
      let lastVerifiedAt: Date | null = null;
      let holderName: string | undefined;

      try {
        const adapter = AdapterRegistry.getAdapter(issuingState);
        if (adapter) {
          const result = await adapter.verify(licenseNumber, licenseType);
          status = result.status === 'active' ? 'active' : result.status;
          lastVerifiedAt = new Date();
          holderName = result.holderName;
        }
      } catch (err) {
        app.log.warn({ err }, 'Verification adapter failed, falling back to manual');
        status = 'pending';
      }

      // Create credential
      const credential = await prisma.credential.create({
        data: {
          userId,
          licenseNumber,
          issuingState,
          licenseType,
          tradeLevel,
          expiryDate: new Date(expiryDate),
          status,
          verificationMethod,
          lastVerifiedAt,
        },
      });

      // Issue a Verifiable Credential if active
      if (status === 'active') {
        const privateKeyB64 = process.env.ISSUER_PRIVATE_KEY ?? '';
        const issuerDid = process.env.ISSUER_DID ?? 'did:voltpass:issuer';

        if (privateKeyB64) {
          const { vcJwt } = issueVC(
            {
              licenseNumber,
              licenseType,
              issuingState,
              tradeLevel,
              status,
              expiryDate: new Date(expiryDate).toISOString(),
              holderDid: `did:voltpass:user:${userId}`,
            },
            Buffer.from(privateKeyB64, 'base64'),
            issuerDid
          );

          await prisma.credential.update({
            where: { id: credential.id },
            data: { vcJwt },
          });
        }
      }

      return reply.status(201).send({ data: { ...credential, status } });
    }
  );

  /**
   * GET /credentials
   * List the current user's credentials.
   */
  app.get('/', { schema: { tags: ['Credentials'], security: [{ bearerAuth: [] }] } }, async (request) => {
    const credentials = await prisma.credential.findMany({
      where: { userId: request.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        licenseNumber: true,
        issuingState: true,
        licenseType: true,
        tradeLevel: true,
        issueDate: true,
        expiryDate: true,
        status: true,
        verificationMethod: true,
        lastVerifiedAt: true,
        createdAt: true,
        // rawDocUrl is deliberately excluded from list response
      },
    });
    return { data: credentials };
  });

  /**
   * GET /credentials/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    { schema: { tags: ['Credentials'], security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const credential = await prisma.credential.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
        select: {
          id: true,
          licenseNumber: true,
          issuingState: true,
          licenseType: true,
          tradeLevel: true,
          issueDate: true,
          expiryDate: true,
          status: true,
          verificationMethod: true,
          lastVerifiedAt: true,
          vcJwt: true,
          createdAt: true,
          // rawDocUrl excluded
        },
      });
      if (!credential) return reply.status(404).send({ error: 'Credential not found' });
      return { data: credential };
    }
  );

  /**
   * DELETE /credentials/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { schema: { tags: ['Credentials'], security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const credential = await prisma.credential.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      });
      if (!credential) return reply.status(404).send({ error: 'Credential not found' });

      await prisma.credential.delete({ where: { id: credential.id } });
      return reply.send({ message: 'Credential deleted' });
    }
  );

  /**
   * POST /credentials/:id/share
   * Generate a time-limited share token (default 24 hours).
   */
  app.post<{ Params: { id: string }; Body: { ttlHours?: number } }>(
    '/:id/share',
    { schema: { tags: ['Credentials'], security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const credential = await prisma.credential.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      });
      if (!credential) return reply.status(404).send({ error: 'Credential not found' });

      const ttlHours = request.body?.ttlHours ?? 24;
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

      await prisma.shareToken.create({
        data: { credentialId: credential.id, token, expiresAt },
      });

      return reply.send({
        data: {
          token,
          credentialId: credential.id,
          expiresAt: expiresAt.toISOString(),
          shareUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/verify?token=${token}`,
        },
      });
    }
  );
}
