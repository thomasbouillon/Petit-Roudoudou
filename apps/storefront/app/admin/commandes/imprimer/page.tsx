'use client';

import { firestoreOrderConverter } from '@couture-next/utils';
import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../../hooks/useDatabase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';

export default function Page() {
  const searchParams = useSearchParams();
  const db = useDatabase();

  const orders = useQuery({
    queryKey: ['orders.find', searchParams.getAll('id')],
    queryFn: async () =>
      Promise.all(
        searchParams
          .getAll('id')
          .map((id) =>
            getDoc(
              doc(collection(db, 'orders'), id).withConverter(
                firestoreOrderConverter
              )
            )
          )
      ).then((orders) =>
        orders.map((snap) => {
          if (!snap.exists()) {
            throw new Error('Order not found');
          }
          return snap.data();
        })
      ),
  });

  return (
    <div className="flex flex-col items-center">
      <button className="btn-primary print:hidden" onClick={window.print}>
        Télécharger
      </button>
      <div className="mt-8 aspect-[1/1.414]">
        {orders.data?.map((order) => (
          <div key={order._id}>
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center">
                <Image
                  loader={loader}
                  src={item.image}
                  width={512}
                  height={512}
                  alt=""
                />
                <div>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
