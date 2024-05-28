import { schedule } from 'node-cron';
import env from './env';
import { TRPCRouter } from '@couture-next/api-connector';
import { createTRPCClient, httpLink } from '@trpc/client';
import superjson from 'superjson';

export function startCronTasks() {
  const proxyToHost = env.HOST === '0.0.0.0' ? '127.0.0.1' : 'localhost';

  const trpc = createTRPCClient<TRPCRouter>({
    links: [
      httpLink({
        url: `http://${proxyToHost}:${env.PORT}/trpc`,
        transformer: superjson,
        headers: {
          Authorization: `Bearer ${env.M2M_TOKEN}`,
        },
      }),
    ],
  });

  // Every day at 00:00, sync shipping rates with Boxtal
  schedule('0 0 * * *', async () => {
    const beforeStart = Date.now();
    console.info('[CRON] Synchronizing products shipping offers');
    await trpc.articles.syncShippingDetails.mutate().catch((err) => {
      console.warn('Failed to sync shipping details', err);
    });
    const secondsElapsed = (Date.now() - beforeStart) / 1000;
    console.info(`[CRON] Done, took ${secondsElapsed}s`);
  });

  console.debug('Registered CRON tasks');
}
