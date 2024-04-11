'use client';

import { trpc } from '../trpc-client';

export const Hello = async () => {
  const txt = await trpc.hello.sayHello.query({ name: 'TRPC SSR' });

  return (
    <div>
      <p className="text-3xl">{txt}</p>
    </div>
  );
};
