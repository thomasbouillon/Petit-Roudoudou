'use client';

import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import Link from 'next/link';

export default function Page() {
  const promotionCodesQuery = trpc.promotionCodes.list.useQuery();
  if (promotionCodesQuery.isPending) return <div>Chargement...</div>;
  if (promotionCodesQuery.isError) throw promotionCodesQuery.error;
  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Codes promotionnels</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {promotionCodesQuery.data.map((promotionCode) => (
          <li className="border-b" key={promotionCode.id}>
            <Link
              className="px-8 py-4 block"
              href={routes().admin().promotionCodes().promotionCode(promotionCode.id).edit()}
            >
              {promotionCode.code}
            </Link>
          </li>
        ))}

        <li>
          <Link href={routes().admin().promotionCodes().new()} className="btn-light text-center w-full">
            Ajouter
          </Link>
        </li>
      </ul>
    </>
  );
}
