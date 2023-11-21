'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { firestoreOrderConverter } from '@couture-next/utils';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import { useState } from 'react';
import clsx from 'clsx';

export default function Page() {
  const db = useDatabase();

  const [mode, setMode] = useState<'select' | 'view'>('view');
  const [selection, setSelection] = useState([] as string[]);

  const getOrdersQuery = useQuery({
    queryKey: ['orders.all'],
    queryFn: async () => {
      const orders = await getDocs(
        collection(db, 'orders').withConverter(firestoreOrderConverter)
      );
      return orders.docs.map((doc) => doc.data());
    },
  });

  const toggleSelection = (id: string) => {
    if (selection.includes(id)) {
      setSelection((selection) => selection.filter((s) => s !== id));
    } else {
      setSelection((selection) => [...selection, id]);
    }
  };

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
              className={clsx(
                'btn-primary',
                selection.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
              href={
                selection.length === 0
                  ? '#'
                  : routes().admin().orders().print(selection)
              }
            >
              Imprimer
            </Link>
          </>
        )}
      </div>
      <ul className="mt-4">
        {getOrdersQuery.data?.map((order) => (
          <li
            key={order._id}
            className="flex items-center justify-between flex-wrap px-4 py-2 first:border-t border-b"
          >
            <div className="space-x-4">
              {mode === 'select' && (
                <input
                  type="checkbox"
                  checked={selection.includes(order._id)}
                  onChange={() => toggleSelection(order._id)}
                />
              )}
              <Link
                href={routes().admin().orders().order(order._id).show()}
                className="underline"
              >
                {order.billing.firstName} {order.billing.lastName} le{' '}
                {order.createdAt.toLocaleDateString()}
              </Link>
            </div>
            <div className="flex items-center flex-wrap">
              {order.items.map((item, i) => (
                <Image
                  src={item.image.url}
                  placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                  blurDataURL={item.image.placeholderDataUrl}
                  key={i}
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
        {getOrdersQuery.isPending && (
          <li className="border-y px-4 py-2">Chargement...</li>
        )}
        {!getOrdersQuery.isPending && !getOrdersQuery.data && (
          <li className="border-y px-4 py-2">Aucune commande pour le moment</li>
        )}
      </ul>
    </div>
  );
}
