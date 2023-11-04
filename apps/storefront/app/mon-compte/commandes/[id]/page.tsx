'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../../hooks/useDatabase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { firestoreOrderConverter } from '@couture-next/utils';
import Image from 'next/image';
import clsx from 'clsx';

export default function Page() {
  const params = useParams();
  const db = useDatabase();
  const orderQuery = useQuery({
    queryKey: ['order', params.id],
    queryFn: () =>
      getDoc(
        doc(
          collection(db, 'orders').withConverter(firestoreOrderConverter),
          params.id as string
        )
      ).then((snap) => {
        if (!snap.exists()) throw new Error('Order not found');
        return snap.data();
      }),
    enabled: !!params.id,
  });

  if (orderQuery.isError) throw orderQuery.error;
  if (orderQuery.isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 rounded-sm border shadow-md">
      <h1 className="text-3xl text-center font-serif mb-8">Commande</h1>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de facturation</h2>
          <p>
            Nom: {orderQuery.data.billing.firstName}{' '}
            {orderQuery.data.billing.lastName}
          </p>
          {orderQuery.data.status === 'paid' && (
            <p>Payée le {orderQuery.data.paidAt.toLocaleDateString()}</p>
          )}
          <div className="flex flex-col">
            <p>Adresse:</p>
            <p>{orderQuery.data.billing.address}</p>
            <p className="empty:hidden">
              {orderQuery.data.billing.addressComplement}
            </p>
            <div>
              {orderQuery.data.billing.zipCode} {orderQuery.data.billing.city}
            </div>
            <p>{orderQuery.data.billing.country}</p>
          </div>
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de livraison</h2>
          <p>
            Client: {orderQuery.data.shipping.firstName}{' '}
            {orderQuery.data.shipping.lastName}
          </p>
          <div className="flex flex-col">
            <p>Adresse:</p>
            <p>{orderQuery.data.shipping.address}</p>
            <p className="empty:hidden">
              {orderQuery.data.shipping.addressComplement}
            </p>
            <div>
              {orderQuery.data.shipping.zipCode} {orderQuery.data.shipping.city}
            </div>
            <p>{orderQuery.data.shipping.country}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 border rounded-sm p-4">
        <h2 className="text-xl font-bold text-center">Articles</h2>
        <ul
          className={clsx(
            'grid place-content-center',
            orderQuery.data.items.length > 1 &&
              'grid-cols-[repeat(auto-fill,30rem)]'
          )}
        >
          {orderQuery.data.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4">
              <Image
                width={256}
                height={256}
                src={item.image}
                alt=""
                className="w-64 h-64 object-contain object-center"
              />
              <div className="flex flex-col">
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
