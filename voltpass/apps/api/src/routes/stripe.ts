import { FastifyInstance, FastifyRequest } from 'fastify';
import Stripe from 'stripe';
import { prisma } from '@voltpass/db';
import { requireAuth } from '../middleware/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-06-20' });

export async function stripeRoutes(app: FastifyInstance) {
  /**
   * POST /stripe/create-checkout
   * Create a Stripe Checkout session for plan upgrade.
   */
  app.post<{ Body: { plan: 'pro' | 'employer' } }>(
    '/create-checkout',
    { preHandler: [requireAuth], schema: { tags: ['Billing'], security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { plan } = request.body;
      const userId = request.user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const priceId =
        plan === 'pro'
          ? process.env.STRIPE_PRO_PRICE_ID
          : process.env.STRIPE_EMPLOYER_PRICE_ID;

      if (!priceId) return reply.status(500).send({ error: 'Price ID not configured' });

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: user.email, name: user.name });
        customerId = customer.id;
        await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/settings?upgraded=true`,
        cancel_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/settings?cancelled=true`,
        metadata: { userId, plan },
      });

      return reply.send({ data: { url: session.url } });
    }
  );

  /**
   * POST /stripe/portal
   * Redirect to Stripe Customer Portal for plan management.
   */
  app.post(
    '/portal',
    { preHandler: [requireAuth], schema: { tags: ['Billing'], security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const user = await prisma.user.findUnique({ where: { id: request.user.userId } });
      if (!user?.stripeCustomerId) return reply.status(400).send({ error: 'No billing account found' });

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/settings`,
      });

      return reply.send({ data: { url: session.url } });
    }
  );

  /**
   * POST /stripe/webhook
   * Handle Stripe webhook events.
   */
  app.post(
    '/webhook',
    {
      config: { rawBody: true },
      schema: { tags: ['Billing'] },
    },
    async (request, reply) => {
      const sig = request.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          (request as any).rawBody ?? JSON.stringify(request.body),
          sig,
          webhookSecret
        );
      } catch (err) {
        return reply.status(400).send({ error: `Webhook signature verification failed: ${err}` });
      }

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const { userId, plan } = session.metadata ?? {};
          if (userId && plan) {
            await prisma.user.update({ where: { id: userId }, data: { plan } });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          const user = await prisma.user.findFirst({ where: { stripeCustomerId: sub.customer as string } });
          if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { plan: 'free' } });
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          app.log.warn({ customerId: invoice.customer }, 'Payment failed for customer');
          // Notification would be dispatched to the worker queue here
          break;
        }
      }

      return reply.send({ received: true });
    }
  );
}
