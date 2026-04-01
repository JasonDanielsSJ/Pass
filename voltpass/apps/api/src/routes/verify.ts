import { FastifyInstance } from 'fastify';
import { prisma } from '@voltpass/db';
import { verifyVC, parseQRPayload } from '@voltpass/vc';

export async function verifyRoutes(app: FastifyInstance) {
  /**
   * GET /verify/:credentialId
   * Verify a credential by ID (employer-facing — no raw doc URL returned).
   */
  app.get<{ Params: { credentialId: string }; Querystring: { token?: string } }>(
    '/:credentialId',
    { schema: { tags: ['Verify'] } },
    async (request, reply) => {
      const { credentialId } = request.params;
      const { token } = request.query;

      // If a share token is provided, validate it
      if (token) {
        const shareToken = await prisma.shareToken.findUnique({ where: { token } });
        if (!shareToken || shareToken.credentialId !== credentialId) {
          return reply.status(401).send({ error: 'Invalid or expired share token' });
        }
        if (shareToken.expiresAt < new Date()) {
          return reply.status(401).send({ error: 'Share token has expired' });
        }
        await prisma.shareToken.update({ where: { id: shareToken.id }, data: { usedAt: new Date() } });
      }

      const credential = await prisma.credential.findUnique({
        where: { id: credentialId },
        select: {
          id: true,
          licenseNumber: true,
          issuingState: true,
          licenseType: true,
          tradeLevel: true,
          expiryDate: true,
          status: true,
          lastVerifiedAt: true,
          vcJwt: true,
          // rawDocUrl deliberately excluded
        },
      });

      if (!credential) return reply.status(404).send({ error: 'Credential not found' });

      // Verify VC signature if present
      let vcValid = false;
      if (credential.vcJwt) {
        const pubKeyB64 = process.env.ISSUER_PUBLIC_KEY ?? '';
        if (pubKeyB64) {
          const result = verifyVC(credential.vcJwt, Buffer.from(pubKeyB64, 'base64'));
          vcValid = result.valid;
        }
      }

      const outcome =
        credential.status === 'expired' || new Date(credential.expiryDate) < new Date()
          ? 'expired'
          : credential.status === 'active'
          ? 'pass'
          : 'fail';

      return reply.send({
        data: {
          credentialId: credential.id,
          licenseNumber: credential.licenseNumber,
          issuingState: credential.issuingState,
          licenseType: credential.licenseType,
          tradeLevel: credential.tradeLevel,
          expiryDate: credential.expiryDate,
          status: credential.status,
          lastVerifiedAt: credential.lastVerifiedAt,
          vcSignatureValid: vcValid,
          outcome,
        },
      });
    }
  );

  /**
   * POST /verify/qr
   * Verify a credential from a QR payload (offline-capable path).
   */
  app.post<{ Body: { qrPayload: string } }>(
    '/qr',
    { schema: { tags: ['Verify'], body: { type: 'object', required: ['qrPayload'], properties: { qrPayload: { type: 'string' } } } } },
    async (request, reply) => {
      const parsed = parseQRPayload(request.body.qrPayload);
      if (!parsed) return reply.status(400).send({ error: 'Invalid QR payload' });
      if (parsed.expired) return reply.status(400).send({ error: 'QR code has expired', expiresAt: parsed.expiresAt });

      const pubKeyB64 = process.env.ISSUER_PUBLIC_KEY ?? '';
      if (!pubKeyB64) return reply.status(500).send({ error: 'Issuer public key not configured' });

      const result = verifyVC(parsed.vcJwt, Buffer.from(pubKeyB64, 'base64'));

      if (!result.valid) {
        return reply.send({ valid: false, error: result.error });
      }

      const cred = result.credential as any;
      return reply.send({
        valid: true,
        credentialId: parsed.credentialId,
        credential: {
          holderDid: cred.credentialSubject?.id,
          licenseNumber: cred.credentialSubject?.licenseNumber,
          licenseType: cred.credentialSubject?.licenseType,
          issuingState: cred.credentialSubject?.issuingState,
          tradeLevel: cred.credentialSubject?.tradeLevel,
          status: cred.credentialSubject?.status,
          expirationDate: cred.expirationDate,
          issuanceDate: cred.issuanceDate,
        },
      });
    }
  );

  /**
   * POST /verify/log
   * Log a verification event (with optional geolocation).
   */
  app.post<{
    Body: {
      credentialId: string;
      verifiedByType: 'employer' | 'inspector' | 'self';
      verifiedById?: string;
      latitude?: number;
      longitude?: number;
      outcome: 'pass' | 'fail' | 'expired';
    };
  }>(
    '/log',
    {
      schema: {
        tags: ['Verify'],
        body: {
          type: 'object',
          required: ['credentialId', 'verifiedByType', 'outcome'],
          properties: {
            credentialId: { type: 'string' },
            verifiedByType: { type: 'string', enum: ['employer', 'inspector', 'self'] },
            verifiedById: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            outcome: { type: 'string', enum: ['pass', 'fail', 'expired'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { credentialId, verifiedByType, verifiedById, latitude, longitude, outcome } = request.body;

      const credential = await prisma.credential.findUnique({ where: { id: credentialId } });
      if (!credential) return reply.status(404).send({ error: 'Credential not found' });

      const log = await prisma.verificationLog.create({
        data: { credentialId, verifiedByType, verifiedById, latitude, longitude, outcome },
      });

      return reply.status(201).send({ data: log });
    }
  );
}
