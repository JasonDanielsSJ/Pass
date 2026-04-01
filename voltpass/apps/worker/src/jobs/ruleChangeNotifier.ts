import { prisma } from '@voltpass/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Called whenever a ReciprocityRule is updated.
 * Finds all users with credentials affected by the changed rule and notifies them.
 */
export async function notifyRuleChange(
  homeState: string,
  targetState: string,
  tradeLevel: string,
  newStatus: 'full' | 'partial' | 'none'
) {
  console.log(`[RuleChange] Rule changed: ${homeState}→${targetState} (${tradeLevel}): ${newStatus}`);

  // Find users with active credentials issued by homeState at the affected tradeLevel
  const affectedCredentials = await prisma.credential.findMany({
    where: {
      issuingState: homeState,
      tradeLevel,
      status: 'active',
    },
    include: { user: true },
  });

  const uniqueUsers = new Map(affectedCredentials.map(c => [c.userId, c.user]));
  console.log(`[RuleChange] Notifying ${uniqueUsers.size} affected users`);

  for (const [, user] of uniqueUsers) {
    const message =
      newStatus === 'full'
        ? `Great news! Your ${homeState} license now has full reciprocity in ${targetState}. You may be cleared to work there.`
        : newStatus === 'partial'
        ? `Update: The reciprocity rules between ${homeState} and ${targetState} have changed. Some additional steps may now be required.`
        : `Important: ${targetState} has updated its reciprocity policy. Your ${homeState} license may no longer be recognized there.`;

    // In-app notification stored in DB (simple approach)
    await prisma.complianceCheck.create({
      data: {
        userId: user.id,
        targetState,
        tradeType: 'electrician',
        verdict: newStatus === 'full' ? 'compliant' : newStatus === 'partial' ? 'partial' : 'ineligible',
        gapSteps: [],
      },
    });

    // Email notification
    try {
      await resend.emails.send({
        from: 'VoltPass <alerts@voltpass.io>',
        to: user.email,
        subject: `Compliance Update: ${homeState} → ${targetState} rules changed`,
        html: `
          <h2>Reciprocity Rule Update</h2>
          <p>Hi ${user.name},</p>
          <p>${message}</p>
          <p>Check your current compliance status:</p>
          <a href="${process.env.APP_URL ?? 'https://voltpass.io'}/check?targetState=${targetState}"
             style="background:#1d4ed8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
            Check Compliance
          </a>
        `,
      });
    } catch (err) {
      console.error('[RuleChange] Failed to email user', user.email, err);
    }
  }
}
