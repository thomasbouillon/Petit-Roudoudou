'use client';

import Link from 'next/link';
import { routes } from '@couture-next/routing';
import Image from 'next/image';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { StorageImage } from '../../StorageImage';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const ordersQuery = trpc.orders.findMyOrders.useQuery(undefined, {
    select: (orders) => orders.filter((order) => order.status !== 'DRAFT'),
  });

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif text-center mb-8">Mes commandes</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
        {ordersQuery.data?.map((order) => (
          <div key={order.id} className="border rounded-sm p-4">
            <Link
              data-posthog-recording-masked
              href={routes().account().orders().order(order.id).show()}
              className="btn-light mx-auto underline"
            >
              Commande n°{order.reference}, le {order.createdAt.toLocaleDateString()}
            </Link>
            {order.status === 'WAITING_BANK_TRANSFER' && (
              <p className="mb-6">Commande en attente de reception du virement bancaire.</p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              {order.items.map((item, i) => (
                <div key={i}>
                  <Image
                    src={item.image.url}
                    placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                    blurDataURL={item.image.placeholderDataUrl ?? undefined}
                    width={128}
                    height={128}
                    loader={loader}
                    className="w-32 h-32 mx-auto object-contain object-center"
                    alt=""
                  />
                  <p className="text-center" data-posthog-recording-masked>
                    {item.description}
                  </p>
                </div>
              ))}
              {order.giftOffered && (
                <div>
                  <StorageImage
                    src="public/images/gift.webp"
                    width={128}
                    height={128}
                    className="w-32 h-32 mx-auto object-contain object-center"
                    alt="Image d'un paquet cadeau"
                  />
                  <p className="text-center" data-posthog-recording-masked>
                    Cadeau offert
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
