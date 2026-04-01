import { FastifyInstance } from 'fastify';
import { prisma } from '@voltpass/db';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAGIC_LINK_TTL_MINUTES = 15;

export async function authRoutes(app: FastifyInstance) {
  /**
   * POST /auth/magic-link
   * Send a magic link email to the provided email address.
   */
  app.post<{ Body: { email: string; name?: string; tradeType?: string; homeState?: string } }>(
    '/magic-link',
    {
      schema: {
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            tradeType: { type: 'string' },
            homeState: { type: 'string', minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, name, tradeType, homeState } = request.body;

      // Upsert user
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        if (!name || !tradeType || !homeState) {
          return reply.status(400).send({ error: 'name, tradeType, and homeState are required for new users' });
        }
        user = await prisma.user.create({
          data: { email, name, tradeType, homeState },
        });
      }

      // Create magic link token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
      await prisma.magicLink.create({
        data: { userId: user.id, token, expiresAt },
      });

      const loginUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/verify?token=${token}`;

      // Send email
      await resend.emails.send({
        from: 'VoltPass <noreply@voltpass.io>',
        to: email,
        subject: 'Sign in to VoltPass',
        html: `
          <h2>Sign in to VoltPass</h2>
          <p>Click the link below to sign in. This link expires in ${MAGIC_LINK_TTL_MINUTES} minutes.</p>
          <a href="${loginUrl}" style="background:#1d4ed8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Sign In</a>
          <p>Or copy this link: ${loginUrl}</p>
        `,
      });

      return reply.send({ message: 'Magic link sent. Check your email.' });
    }
  );

  /**
   * POST /auth/verify
   * Verify a magic link token and return a JWT session.
   */
  app.post<{ Body: { token: string } }>(
    '/verify',
    {
      schema: {
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['token'],
          properties: { token: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { token } = request.body;

      const magicLink = await prisma.magicLink.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!magicLink) return reply.status(401).send({ error: 'Invalid token' });
      if (magicLink.usedAt) return reply.status(401).send({ error: 'Token already used' });
      if (magicLink.expiresAt < new Date()) return reply.status(401).send({ error: 'Token expired' });

      // Mark token as used
      await prisma.magicLink.update({
        where: { id: magicLink.id },
        data: { usedAt: new Date() },
      });

      const { user } = magicLink;
      const jwt = app.jwt.sign({
        userId: user.id,
        email: user.email,
        plan: user.plan,
      });

      return reply.send({
        token: jwt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tradeType: user.tradeType,
          homeState: user.homeState,
          plan: user.plan,
        },
      });
    }
  );
}
