import { schedule } from 'node-cron';
import { trpcM2M } from './trpc';

export function startCronTasks() {
  // Every day at 00:00, sync shipping rates with Boxtal
  schedule('0 0 * * *', async () => {
    const beforeStart = Date.now();
    console.info('[CRON] Synchronizing products shipping offers');
    await trpcM2M.articles.syncShippingDetails.mutate().catch((err) => {
      console.warn('Failed to sync shipping details', err);
    });
    const secondsElapsed = (Date.now() - beforeStart) / 1000;
    console.info(`[CRON] Done, took ${secondsElapsed}s`);
  });

  console.debug('Registered CRON tasks');
}
