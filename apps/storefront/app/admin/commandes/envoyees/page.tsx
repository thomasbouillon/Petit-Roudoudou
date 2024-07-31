'use client';

import React from 'react';
import { trpc } from 'apps/storefront/trpc-client';
import { Orders } from '../Orders';

export default function Page() {
  const getOrdersQuery = trpc.orders.find.useQuery({
    onlyShipped: true,
    limit: 40,
  });
  if (getOrdersQuery.isError) throw getOrdersQuery.error;

  return (
    <div className="max-w-3xl mx-auto my-8 py-4 border">
      <h1 className="text-3xl text-center font-serif px-4">Commandes</h1>
      <p className="text-center">(trié par date de commande, limité aux 40 dernières)</p>
      {getOrdersQuery.isPending && <div className="text-center">Chargement...</div>}
      <ul className="mt-4">
        <Orders orders={getOrdersQuery.data ?? []} title="Commandes envoyées" variant="show-shipped-at" />
      </ul>
    </div>
  );
}
