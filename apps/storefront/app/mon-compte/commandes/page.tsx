'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../hooks/useDatabase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { firestoreOrderConverter } from '@couture-next/utils';
import { routes } from '@couture-next/routing';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { useAuth } from '../../../contexts/AuthContext';

export default function Page() {
  const db = useDatabase();
  const { userQuery } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const snapshot = await getDocs(
        query(
          collection(db, 'orders').withConverter(firestoreOrderConverter),
          where('user.uid', '==', userQuery.data?.uid),
          where('status', '!=', 'draft')
        )
      );
      return snapshot.docs.map((doc) => doc.data()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif text-center mb-8">Mes commandes</h1>
      <div className="flex flex-col items-center">
        {ordersQuery.data?.map((order) => (
          <div key={order._id} className="border rounded-sm p-4">
            <Link
              data-posthog-recording-masked
              href={routes().account().orders().order(order._id).show()}
              className="btn-light mx-auto underline"
            >
              {order.createdAt.toLocaleDateString()}
            </Link>
            {order.status === 'waitingBankTransfer' && (
              <p className="mb-6">Commande en attente de reception du virement bancaire.</p>
            )}
            <div>
              {order.items.map((item, i) => (
                <div key={i}>
                  <Image
                    src={item.image.url}
                    placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                    blurDataURL={item.image.placeholderDataUrl}
                    width={256}
                    height={256}
                    loader={loader}
                    className="w-64 h-64 mx-auto object-contain object-center"
                    alt=""
                  />
                  <p className="text-center" data-posthog-recording-masked>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
