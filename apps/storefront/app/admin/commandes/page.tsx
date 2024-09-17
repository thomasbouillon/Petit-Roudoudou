'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AllowNewOrdersToggleButton } from './AllowNewOrdersToggleButton';
import { AllowOrdersWithReduceManufacturingTimesToggleButton } from './AllowOrdersWithreduceManufacturingTimesToggleButton';
import { trpc } from 'apps/storefront/trpc-client';
import { Order } from '@prisma/client';
import { Orders, OrdersProps } from './Orders';
import Link from 'next/link';
import { routes } from '@couture-next/routing';

export default function Page() {
  const [mode, setMode] = useState<'select' | 'view'>('view');
  const [selection, setSelection] = useState([] as string[]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      scrollTo(0, 0);
    }
  }, []);

  const getOrdersQuery = trpc.orders.find.useQuery(
    {},
    {
      select: (data) => {
        const orders = data.reduce(
          (acc, order) => {
            if (order.status === 'PAID' && order.workflowStep === 'DELIVERED') {
              acc.paid.delivered.push(order);
            } else if (order.status === 'PAID' && order.workflowStep === 'SHIPPING') {
              acc.paid.inDelivery.push(order);
            } else if (
              order.extras.reduceManufacturingTimes !== null &&
              ((order.status === 'PAID' && order.workflowStep === 'PRODUCTION') ||
                order.status === 'WAITING_BANK_TRANSFER')
            ) {
              acc.urgent.push(order);
            } else if (order.status === 'PAID' && order.workflowStep === 'PRODUCTION') {
              acc.paid.inProgress.push(order);
            } else if (order.status === 'WAITING_BANK_TRANSFER') {
              acc.waitingForBankTransfer.push(order);
            } else {
              console.warn("Order doesn't match any category", order.id);
            }
            return acc;
          },
          {
            paid: {
              delivered: [],
              inDelivery: [],
              inProgress: [],
            },
            waitingForBankTransfer: [],
            urgent: [],
          } as {
            paid: {
              inProgress: Order[];
              inDelivery: Order[];
              delivered: Order[];
            };
            waitingForBankTransfer: Order[];
            urgent: Order[];
          }
        );
        return orders;
      },
    }
  );
  if (getOrdersQuery.isError) throw getOrdersQuery.error;

  const toggleSelection = useCallback(
    (id: string) => {
      if (selection.includes(id)) {
        setSelection((selection) => selection.filter((s) => s !== id));
      } else {
        setSelection((selection) => [...selection, id]);
      }
    },
    [selection]
  );

  const ordersProps = useMemo(
    () =>
      (mode === 'select'
        ? {
            variant: 'select',
            selection,
            toggleSelection,
          }
        : {
            variant: 'default',
          }) satisfies Pick<OrdersProps<'default' | 'select'>, 'variant' | 'toggleSelection' | 'selection'>,
    [mode, selection, toggleSelection]
  );

  return (
    <div className="max-w-3xl mx-auto my-8 py-4 border">
      <h1 className="text-3xl text-center font-serif px-4">Commandes</h1>
      <div className="flex justify-end px-4 mb-6">
        <Link href={routes().admin().orders().sent()} className="btn-light">
          Commande envoyées
        </Link>
        {mode === 'view' && (
          <button className="btn-light" onClick={() => setMode('select')}>
            Imprimer
          </button>
        )}
        {mode === 'select' && (
          <>
            <button className="btn-light mr-4" onClick={() => setMode('view')}>
              Annuler
            </button>
            <Link
              className={clsx('btn-primary', selection.length === 0 && 'bg-opacity-50 cursor-not-allowed')}
              href={selection.length === 0 ? '#' : routes().admin().orders().print(selection)}
            >
              Imprimer
            </Link>
          </>
        )}
      </div>
      <div className="flex flex-col items-center">
        <div>
          <AllowNewOrdersToggleButton />
          <AllowOrdersWithReduceManufacturingTimesToggleButton />
        </div>
      </div>
      {getOrdersQuery.isPending && <div className="text-center">Chargement...</div>}
      <ul className="mt-4">
        <Orders orders={getOrdersQuery.data?.urgent ?? []} title="Commandes urgentes" {...ordersProps} />
        <Orders
          orders={getOrdersQuery.data?.waitingForBankTransfer ?? []}
          title="En attente de paiement"
          {...ordersProps}
        />
        <Orders orders={getOrdersQuery.data?.paid.inProgress ?? []} title="En cours de confection" {...ordersProps} />
        <Orders orders={getOrdersQuery.data?.paid.inDelivery ?? []} title="En cours de livraison" {...ordersProps} />
        <Orders orders={getOrdersQuery.data?.paid.delivered ?? []} title="Livré" {...ordersProps} />
      </ul>
    </div>
  );
}
