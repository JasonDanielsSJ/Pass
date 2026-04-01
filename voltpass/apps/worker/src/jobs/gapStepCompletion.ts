import { prisma } from '@voltpass/db';
import { checkCompliance, ActiveCredential, ReciprocityRule, StateRequirement } from '@voltpass/compliance';

/**
 * Triggered when a user marks a gap step as complete.
 * Re-runs compliance check; if now fully compliant, sends a push notification.
 */
export async function handleGapStepCompletion(
  userId: string,
  targetState: string,
  tradeLevel: string
) {
  console.log(`[GapStep] Re-checking compliance for user ${userId} → ${targetState}`);

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

  const homeStates = [...new Set(credentials.map(c => c.issuingState))];
  const dbRules = await prisma.reciprocityRule.findMany({
    where: { homeState: { in: homeStates }, targetState, tradeLevel },
  });

  const rules: ReciprocityRule[] = dbRules.map(r => ({
    homeState: r.homeState,
    targetState: r.targetState,
    tradeLevel: r.tradeLevel as any,
    status: r.status as 'full' | 'partial' | 'none',
    conditions: r.conditions ? (r.conditions as string[]) : undefined,
  }));

  const reqIds = rules.flatMap(r => r.conditions ?? []);
  const dbReqs = reqIds.length
    ? await prisma.stateRequirement.findMany({ where: { id: { in: reqIds } } })
    : [];

  const requirementsMap = new Map<string, StateRequirement>(
    dbReqs.map(r => [r.id, {
      id: r.id,
      name: r.name,
      requirementType: r.requirementType,
      description: r.description ?? undefined,
      feeAmount: r.feeAmount ? Number(r.feeAmount) : undefined,
      processingDays: r.processingDays ?? undefined,
      formUrl: r.formUrl ?? undefined,
    }])
  );

  const result = checkCompliance(credentials, targetState, tradeLevel as any, rules, requirementsMap);

  // Update latest compliance check
  await prisma.complianceCheck.create({
    data: {
      userId,
      targetState,
      tradeType: 'electrician',
      verdict: result.verdict,
      gapSteps: result.gapSteps ?? [],
    },
  });

  if (result.verdict === 'compliant') {
    await sendClearedToWorkPush(userId, targetState);
  }

  return result;
}

async function sendClearedToWorkPush(userId: string, targetState: string) {
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  if (!fcmServerKey) return;

  const topic = `/topics/user-${userId}`;
  try {
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: topic,
        notification: {
          title: `You're cleared to work in ${targetState}!`,
          body: `All compliance requirements for ${targetState} are now satisfied. Open VoltPass to view your status.`,
        },
        data: { type: 'CLEARED_TO_WORK', targetState },
      }),
    });
  } catch (err) {
    console.error('[GapStep] FCM push error:', err);
  }
}
