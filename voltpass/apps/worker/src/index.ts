import cron from 'node-cron';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { runExpiryAlerts } from './jobs/expiryAlerts';
import { notifyRuleChange } from './jobs/ruleChangeNotifier';
import { handleGapStepCompletion } from './jobs/gapStepCompletion';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

// ── Queues ───────────────────────────────────────────────────────────────────
export const notificationQueue = new Queue('notifications', { connection });
export const complianceQueue = new Queue('compliance', { connection });

// ── Workers ──────────────────────────────────────────────────────────────────
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    switch (job.name) {
      case 'rule-change':
        await notifyRuleChange(
          job.data.homeState,
          job.data.targetState,
          job.data.tradeLevel,
          job.data.newStatus
        );
        break;
      case 'gap-step-complete':
        await handleGapStepCompletion(job.data.userId, job.data.targetState, job.data.tradeLevel);
        break;
      default:
        console.warn('[Worker] Unknown notification job:', job.name);
    }
  },
  { connection }
);

notificationWorker.on('completed', job => console.log(`[Worker] Job ${job.id} completed`));
notificationWorker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err));

// ── Scheduled Jobs ───────────────────────────────────────────────────────────
// Daily expiry alerts at 08:00 server time
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running daily expiry alert job...');
  try {
    await runExpiryAlerts();
  } catch (err) {
    console.error('[Cron] Expiry alert job failed:', err);
  }
});

console.log('VoltPass worker started. Listening for jobs...');
