'use client';

import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';

export default function Page() {
  const giftCardsQuery = trpc.giftCards.list.useQuery();
  if (giftCardsQuery.isPending) return <div>Chargement...</div>;
  if (giftCardsQuery.isError) throw giftCardsQuery.error;
  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Codes promotionnels</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {giftCardsQuery.data.map((giftCard) => (
          <li className="border-b px-4 py-2 flex justify-between" key={giftCard.id}>
            {/* <span>{giftCard.code ?? ((!giftCard.userId && 'En attente de liaison') || 'Associée à un client')}</span> */}
            <span>
              {!!giftCard.code
                ? giftCard.code + ' - ' + (!giftCard.userId ? 'Pas attribuée' : 'Associée à un client')
                : (!giftCard.userId && 'En attente de liaison') || 'Associée à un client'}
            </span>
            <span>{giftCard.amount} €</span>
          </li>
        ))}

        <li>
          <Link href={routes().admin().giftCards().new()} className="btn-light text-center w-full">
            Ajouter
          </Link>
        </li>
      </ul>
    </>
  );
}
