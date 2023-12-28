'use client';

import { routes } from '@couture-next/routing';
import { PromotionCode } from '@couture-next/types';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { useQuery } from '@tanstack/react-query';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function Page() {
  const database = useDatabase();
  const promotionCodesQuery = useQuery({
    queryKey: ['promotionCodes'],
    queryFn: () =>
      getDocs(
        collection(database, 'promotionCodes').withConverter(firestoreConverterAddRemoveId<PromotionCode>())
      ).then((snapshot) => snapshot.docs.map((doc) => doc.data())),
  });
  if (promotionCodesQuery.isPending) return <div>Chargement...</div>;
  if (promotionCodesQuery.isError) throw promotionCodesQuery.error;
  return (
    <>
      <h1 className="text-3xl font-serif text-center mb-8">Codes promotionnels</h1>
      <ul className="border rounded-md shadow-md mx-auto max-w-md w-full">
        {promotionCodesQuery.data.map((promotionCode) => (
          <li className="border-b py-4">
            <Link
              className="px-8 block"
              href={routes().admin().promotionCodes().promotionCode(promotionCode._id).edit()}
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
