import { createTRPCClient, httpBatchLink } from '@trpc/client';
import env from './env';
import * as superjson from 'superjson';
import type { TRPCRouter } from '@couture-next/api-connector';

export const trpc = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchLink({
      url: env.API_BASE_URL,
      transformer: superjson,
      headers: {},
    }),
  ],
});
