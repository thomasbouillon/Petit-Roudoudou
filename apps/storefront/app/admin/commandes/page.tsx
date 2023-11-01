'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import { firestoreOrderConverter } from '@couture-next/utils';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';

export default function Page() {
  const db = useDatabase();
  const getOrdersQuery = useQuery({
    queryKey: ['orders.all'],
    queryFn: async () => {
      const orders = await getDocs(
        collection(db, 'orders').withConverter(firestoreOrderConverter)
      );
      return orders.docs.map((doc) => doc.data());
    },
  });

  return (
    <div className="max-w-3xl mx-auto my-8 py-4 border">
      <h1 className="text-3xl text-center font-serif px-4">Commandes</h1>
      <ul className="mt-4">
        {getOrdersQuery.data?.map((order) => (
          <li
            key={order._id}
            className="flex items-center justify-between flex-wrap px-4 py-2 first:border-t border-b"
          >
            <p>
              {order.billing.firstName} {order.billing.lastName} le{' '}
              {order.createdAt.toLocaleDateString()}
            </p>
            <div className="flex items-center flex-wrap">
              {order.items.map((item, i) => (
                <Image
                  src={item.image}
                  key={i}
                  className="w-16 h-16 object-contain object-center"
                  width={64}
                  height={64}
                  alt=""
                />
              ))}
            </div>
          </li>
        ))}
        {getOrdersQuery.isLoading && (
          <li className="border-y px-4 py-2">Chargement...</li>
        )}
        {!getOrdersQuery.isLoading && !getOrdersQuery.data && (
          <li className="border-y px-4 py-2">Aucune commande pour le moment</li>
        )}
      </ul>
    </div>
  );
}
