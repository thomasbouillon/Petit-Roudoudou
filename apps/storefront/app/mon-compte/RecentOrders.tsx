'use client';

import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import Link from 'next/link';

export function RecentOrders() {
  const ordersQuery = trpc.orders.findMyOrders.useQuery();

  if (ordersQuery.isError) throw ordersQuery.error;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-serif mb-6">Mes commandes</h2>
      {ordersQuery.isPending ? (
        <p>Chargement de vos commandes...</p>
      ) : ordersQuery.data.length === 0 ? (
        <>
          <p className="text-center">Vous n'avez pas encore passé de commande.</p>
          <Link href={routes().shop().index()} className="btn-primary mx-auto mt-4">
            Découvrez nos produits
          </Link>
        </>
      ) : (
        <>
          <p className="mb-4">
            Dernière commande:{' '}
            <Link className="underline" href={routes().account().orders().order(ordersQuery.data[0].id).show()}>
              n°{ordersQuery.data[0].reference}
            </Link>
          </p>
          <div className="flex flex-wrap">
            {ordersQuery.data[0].items.map((item) => (
              <Image
                src={item.image.url}
                placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={item.image.placeholderDataUrl ?? undefined}
                width={64}
                height={64}
                loader={loader}
                className="w-16 h-16 object-contain object-center"
                alt=""
                key={item.image.uid}
              />
            ))}
          </div>
          <Link href={routes().account().orders().index()} className="btn-primary mx-auto mt-4">
            Voir plus
          </Link>
        </>
      )}
    </div>
  );
}
