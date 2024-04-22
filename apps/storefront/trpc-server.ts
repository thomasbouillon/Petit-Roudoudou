import { loggerLink } from '@trpc/client';
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp';
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server';
import type { TRPCRouter } from '@couture-next/api-connector';
import superjson from 'superjson';
import env from './env';

// https://github.com/trpc/trpc/issues/3297
// ssr only (for now)

export const trpc = experimental_createTRPCNextAppDirServer<TRPCRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (op) => true,
        }),
        experimental_nextHttpLink({
          batch: true,
          url: env.API_BASE_URL,
          transformer: superjson,
          headers() {
            return {
              // cookie: cookies().toString(),
              'x-trpc-source': 'rsc-http',
            };
          },
        }),
      ],
    };
  },
});

// export const createAction =
