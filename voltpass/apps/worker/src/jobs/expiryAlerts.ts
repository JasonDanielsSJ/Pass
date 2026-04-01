import { prisma } from '@voltpass/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ALERT_DAYS = [90, 60, 30, 7];

/**
 * Runs daily at 08:00 local time.
 * Finds credentials expiring in exactly 90, 60, 30, or 7 days and sends alerts.
 */
export async function runExpiryAlerts() {
  console.log('[ExpiryAlerts] Starting daily expiry scan...');

  for (const days of ALERT_DAYS) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const expiring = await prisma.credential.findMany({
      where: {
        expiryDate: { gte: dayStart, lte: dayEnd },
        status: 'active',
      },
      include: { user: true },
    });

    console.log(`[ExpiryAlerts] Found ${expiring.length} credentials expiring in ${days} days`);

    for (const cred of expiring) {
      await sendExpiryEmail(cred.user.email, cred.user.name, cred, days);
      await sendFCMPush(cred.userId, cred, days);
    }
  }

  console.log('[ExpiryAlerts] Scan complete');
}

async function sendExpiryEmail(
  email: string,
  name: string,
  credential: { licenseNumber: string; issuingState: string; licenseType: string; expiryDate: Date; id: string },
  daysRemaining: number
) {
  const renewUrl = `${process.env.APP_URL ?? 'https://voltpass.io'}/credentials/${credential.id}/renew`;
  try {
    await resend.emails.send({
      from: 'VoltPass <alerts@voltpass.io>',
      to: email,
      subject: `Action Required: Your ${credential.issuingState} license expires in ${daysRemaining} days`,
      html: `
        <h2>License Expiry Alert</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${credential.licenseType}</strong> license
           (<strong>${credential.licenseNumber}</strong>) issued by <strong>${credential.issuingState}</strong>
           expires on <strong>${credential.expiryDate.toLocaleDateString()}</strong>.</p>
        <p>That's ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} from today.</p>
        <p>Renew now to stay compliant:</p>
        <a href="${renewUrl}" style="background:#1d4ed8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
          Renew License
        </a>
      `,
    });
  } catch (err) {
    console.error('[ExpiryAlerts] Failed to send email to', email, err);
  }
}

async function sendFCMPush(
  userId: string,
  credential: { licenseNumber: string; issuingState: string; id: string },
  daysRemaining: number
) {
  const fcmServerKey = process.env.FCM_SERVER_KEY;
  if (!fcmServerKey) return;

  // In production, look up the user's FCM device token from a device_tokens table.
  // For the MVP, we dispatch to the FCM topic for the user.
  const topic = `/topics/user-${userId}`;

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: topic,
        notification: {
          title: 'License Expiring Soon',
          body: `Your ${credential.issuingState} license expires in ${daysRemaining} days. Tap to renew.`,
        },
        data: {
          type: 'EXPIRY_ALERT',
          credentialId: credential.id,
          daysRemaining: String(daysRemaining),
        },
      }),
    });

    if (!response.ok) {
      console.error('[ExpiryAlerts] FCM push failed:', response.status);
    }
  } catch (err) {
    console.error('[ExpiryAlerts] FCM push error:', err);
  }
}
