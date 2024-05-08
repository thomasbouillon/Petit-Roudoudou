'use client';

import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import Image from 'next/image';
import Link from 'next/link';

export default function Page({ params: { id } }: { params: { id: string } }) {
  const userQuery = trpc.users.findById.useQuery(id);

  if (userQuery.isError) throw userQuery.error;
  if (userQuery.isPending) return <p>Chargement...</p>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-center mb-6">Ficher client</h1>
      <div className="rounded border max-w-md w-full mx-auto p-4">
        <p>
          <span className="font-bold">Email:</span> {userQuery.data.email}
        </p>
        <p>
          <span className="font-bold">Prénom:</span> {userQuery.data.firstName}
        </p>
        <p>
          <span className="font-bold">Nom:</span> {userQuery.data.lastName}
        </p>
        <p className="mt-2">Si tu cherches le numéro de téléphone, regarde sa dernière commande</p>
        <p className="mt-4">Inscrit le {new Date(userQuery.data.createdAt).toLocaleDateString()}</p>
      </div>
      <section className="mt-8 max-w-2xl mx-auto">
        <h2 className="text-3xl text-center font-serif mb-4">Panier</h2>
        <ul>
          {!userQuery.data.cart?.items.length && !userQuery.isPending && (
            <li className="text-center">Panier vide 😢</li>
          )}
          {userQuery.data.cart?.items.map((item, i) => (
            <li key={i} className="odd:bg-gray-100 p-2 flex items-center gap-4 justify-center">
              <Image
                src={item.image.url}
                width={64}
                height={64}
                loader={loader}
                alt=""
                className="basis-16 aspect-square object-contain"
              />
            </li>
          ))}
        </ul>
        {userQuery.data.cart !== null && (
          <p className="text-center mt-2">Total: {userQuery.data.cart?.totalTaxIncluded.toFixed(2)} €</p>
        )}
      </section>
      <section className="mt-8 max-w-2xl mx-auto">
        <h2 className="text-3xl text-center font-serif mb-4">Commandes</h2>
        <ul>
          {userQuery.data.orders.length === 0 && <li className="text-center">Aucune commande 😢</li>}
          {userQuery.data.orders.map((order) => (
            <li className="odd:bg-gray-100" key={order.id}>
              <Link
                href={routes().admin().orders().order(order.id).show()}
                className="p-2 flex items-center gap-4 justify-between"
              >
                <span>
                  n°{order.reference}
                  {' - '}
                  {order.paidAt
                    ? 'Le ' + order.paidAt.toLocaleDateString()
                    : order.billing.paymentMethod === 'BANK_TRANSFER'
                    ? 'En attente du virement'
                    : 'Brouillon (CB)'}
                  , {order.totalTaxIncluded.toFixed(2)}€
                </span>
                <ul className="flex flex-wrap gap-2">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      <Image
                        src={item.image.url}
                        width={64}
                        height={64}
                        loader={loader}
                        alt=""
                        className="basis-16 aspect-square object-contain"
                      />
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
