'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestoreOrderConverter } from '@couture-next/utils';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import React, { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Order, PaidOrder, UrgentOrder, WaitingBankTransferOrder } from '@couture-next/types';
import { AllowNewOrdersToggleButton } from './AllowNewOrdersToggleButton';

export default function Page() {
  const db = useDatabase();

  const [mode, setMode] = useState<'select' | 'view'>('view');
  const [selection, setSelection] = useState([] as string[]);

  const getOrdersCountQuery = useQuery({
    queryKey: ['orders.all.count'],
    queryFn: async () => {
      const totalCount = await getCountFromServer(
        query(
          collection(db, 'orders'),
          where('status', '!=', 'draft'),
          where('archivedAt', '==', null),
          orderBy('status')
        )
      ).then((snap) => snap.data().count);
      return totalCount;
    },
  });
  if (getOrdersCountQuery.isError) throw getOrdersCountQuery.error;

  const getOrdersQuery = useQuery({
    queryKey: ['orders.all'],
    queryFn: async () => {
      const orders = await getDocs(
        query(
          collection(db, 'orders').withConverter(firestoreOrderConverter),
          where('status', '!=', 'draft'),
          where('archivedAt', '==', null),
          orderBy('status', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(50)
        )
      );
      return orders.docs
        .map((doc) => doc.data())
        .reduce(
          (acc, order) => {
            if (order.status === 'paid' && order.workflowStep === 'delivered') {
              acc.paid.delivered.push(order);
            } else if (order.extras.reduceManufacturingTimes !== undefined) {
              acc.urgent.push(order as UrgentOrder);
            } else if (order.status === 'paid' && order.workflowStep === 'in-delivery') {
              acc.paid.inDelivery.push(order);
            } else if (order.status === 'paid' && order.workflowStep === 'in-production') {
              acc.paid.inProgress.push(order);
            } else if (order.status === 'waitingBankTransfer') {
              acc.waitingForBankTransfer.push(order);
            } else {
              console.warn("Order doesn't match any category", order._id);
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
              inProgress: PaidOrder[];
              inDelivery: PaidOrder[];
              delivered: PaidOrder[];
            };
            waitingForBankTransfer: WaitingBankTransferOrder[];
            urgent: UrgentOrder[];
          }
        );
    },
  });
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

  const shownOrdersCount = useMemo(
    () =>
      Object.values(getOrdersQuery.data ?? {}).reduce(
        (acc, orders) =>
          (acc += Array.isArray(orders)
            ? orders.length
            : Object.values(orders).reduce((acc, orders) => acc + orders.length, 0)),
        0
      ),
    [getOrdersQuery.data]
  );

  return (
    <div className="max-w-3xl mx-auto my-8 py-4 border">
      <h1 className="text-3xl text-center font-serif px-4">Commandes</h1>
      <div className="flex justify-end px-4">
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
              className={clsx('btn-primary', selection.length === 0 && 'opacity-50 cursor-not-allowed')}
              href={selection.length === 0 ? '#' : routes().admin().orders().print(selection)}
            >
              Imprimer
            </Link>
          </>
        )}
      </div>
      <div className="flex flex-col items-center">
        <AllowNewOrdersToggleButton />
      </div>
      {!getOrdersCountQuery.isPending && !getOrdersQuery.isPending && shownOrdersCount !== getOrdersCountQuery.data && (
        <p className="text-primary-100 text-center">
          Avertissement, il y a {getOrdersCountQuery.data} résultats mais je ne t'en montre que {shownOrdersCount}
        </p>
      )}
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

type OrdersProps<T extends 'default' | 'select'> = {
  orders: Order[];
  title: string;
} & (T extends 'select'
  ? {
      variant: 'select';
      selection: string[];
      toggleSelection: (id: string) => void;
    }
  : {
      variant?: 'default';
      selection?: never;
      toggleSelection?: never;
    });

const Orders = <TVariant extends 'default' | 'select'>({
  orders,
  title,
  variant,
  selection,
  toggleSelection,
}: OrdersProps<TVariant>) => {
  if (orders.length === 0) return null;
  return (
    <div className="max-w-3xl mx-auto my-8 py-4">
      <h2 className="text-xl text-center font-bold px-4">{title}</h2>
      <ul className="mt-4">
        {orders.map((order) => (
          <li key={order._id} className="flex items-center justify-between flex-wrap px-4 py-2 first:border-t border-b">
            <div className="space-x-4">
              {variant === 'select' && (
                <input
                  type="checkbox"
                  checked={selection.includes(order._id)}
                  onChange={() => toggleSelection(order._id)}
                />
              )}
              <Link href={routes().admin().orders().order(order._id).show()} className="underline">
                #{order.reference} - {order.billing.firstName} {order.billing.lastName}
                {order.status === 'paid' && <> le {order.createdAt.toLocaleDateString()}</>}
              </Link>
            </div>
            <div className="flex items-center flex-wrap">
              {order.items.map((item, i) => (
                <Image
                  src={item.image.url}
                  placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                  blurDataURL={item.image.placeholderDataUrl}
                  key={item.image.url}
                  className="w-16 h-16 object-contain object-center"
                  loader={loader}
                  width={64}
                  height={64}
                  alt=""
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
