import { createTRPCClient, httpLink } from '@trpc/client';
import env from './env';
import { TRPCRouter } from '@couture-next/api-connector';
import superjson from 'superjson';

const proxyToHost = env.HOST === '0.0.0.0' ? '127.0.0.1' : 'localhost';

export const trpcM2M = createTRPCClient<TRPCRouter>({
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
