import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@voltpass/db';

export interface JWTPayload {
  userId: string;
  email: string;
  plan: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

/**
 * Require a valid JWT session.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Enforce Free plan limits:
 *  - Max 1 credential
 *  - Compliance checks for only 3 states
 */
export async function enforcePlanLimits(
  request: FastifyRequest<{ Body: { targetState?: string } }>,
  reply: FastifyReply,
  type: 'credential' | 'compliance'
) {
  const user = request.user;
  if (user.plan !== 'free') return; // Pro/Employer have no limits

  if (type === 'credential') {
    const count = await prisma.credential.count({ where: { userId: user.userId } });
    if (count >= 1) {
      return reply.status(403).send({
        error: 'Free plan limit reached',
        message: 'Upgrade to Pro to add unlimited credentials.',
      });
    }
  }

  if (type === 'compliance') {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const checks = await prisma.complianceCheck.findMany({
      where: { userId: user.userId, checkedAt: { gte: threeMonthsAgo } },
      select: { targetState: true },
      distinct: ['targetState'],
    });
    if (checks.length >= 3) {
      const targetState = (request.body as { targetState?: string })?.targetState;
      const alreadyChecked = checks.some(c => c.targetState === targetState);
      if (!alreadyChecked) {
        return reply.status(403).send({
          error: 'Free plan limit reached',
          message: 'Upgrade to Pro to check compliance in more than 3 states.',
        });
      }
    }
  }
}
