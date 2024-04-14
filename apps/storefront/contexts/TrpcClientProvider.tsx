'use client';

import { useQueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { PropsWithChildren, useState } from 'react';
import { trpc } from '../trpc-client';
import superjson from 'superjson';
import env from '../env';

export function TrpcClientProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: env.API_BASE_URL,

          // You can pass any HTTP headers you wish here
          async headers() {
            return {
              //   authorization: getAuthCookie(),
            };
          },

          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}
