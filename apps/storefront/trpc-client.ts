'use client';

import { loggerLink } from '@trpc/client';
import { experimental_createTRPCNextAppDirClient } from '@trpc/next/app-dir/client';
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp';
import type { TRPCRouter } from '@couture-next/api-connector';
import superjson from 'superjson';
import env from './env';

// https://github.com/trpc/trpc/issues/3297
// Experimental do the ssr in client components, in the future, we should be able to use the same trpc app client

export const trpc = experimental_createTRPCNextAppDirClient<TRPCRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (op) => true,
        }),
        experimental_nextHttpLink({
          transformer: superjson,
          batch: true,
          url: env.API_BASE_URL,
          headers() {
            return {
              'x-trpc-source': 'client',
            };
          },
        }),
      ],
    };
  },
});

// export const useAction = experimental_createActionHook<AppRouter>({
//   links: [
//     loggerLink(),
//     experimental_serverActionLink({
//       transformer: superjson,
//     }),
//   ],
// });
