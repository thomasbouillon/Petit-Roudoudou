'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { TRPCRouter } from '@couture-next/api-connector';

export const trpc = createTRPCReact<TRPCRouter>();

// https://github.com/trpc/trpc/issues/3297
// Experimental do the ssr in client components, in the future, we should be able to use the same trpc app client

// experimental_createTRPCNextAppDirClient<TRPCRouter>({
//   config() {
//     return {
//       links: [
//         loggerLink({
//           enabled: (op) => true,
//         }),
//         experimental_nextHttpLink({
//           transformer: superjson,
//           batch: true,
//           url: env.API_BASE_URL,
//           headers() {
//             return {
//               'x-trpc-source': 'client',
//             };
//           },
//         }),
//       ],
//     };
//   },
// });

// export const useAction = experimental_createActionHook<AppRouter>({
//   links: [
//     loggerLink(),
//     experimental_serverActionLink({
//       transformer: superjson,
//     }),
//   ],
// });
