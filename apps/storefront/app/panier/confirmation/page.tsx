'use client';

import { useMemo } from 'react';
import useDatabase from '../../../../storefront/hooks/useDatabase';
import { useLiveFirestoreDocument } from '../../../../storefront/hooks/useLiveFirestoreDocument';
import { collection, doc } from 'firebase/firestore';
import { Spinner } from '@couture-next/ui';
import { useSearchParams } from 'next/navigation';
import { firestoreOrderConverter } from '@couture-next/utils';
import { useAuth } from '../../../contexts/AuthContext';

export default function Page() {
  const { user } = useAuth();
  const queryParams = useSearchParams();
  const database = useDatabase();
  const docRef = useMemo(
    () =>
      doc(
        collection(database, 'orders').withConverter(firestoreOrderConverter),
        (queryParams.get('orderId') as string) ?? 'will-not-be-used'
      ),
    [database, queryParams]
  );

  const currentOrderQuery = useLiveFirestoreDocument(
    ['carts.find', queryParams.get('orderId')],
    docRef,
    {
      enabled: !!queryParams.get('orderId') && !!user,
    }
  );

  if (currentOrderQuery.isError) throw currentOrderQuery.error;
  if (!currentOrderQuery.isLoading && !currentOrderQuery.data)
    throw 'Order not found';

  return (
    <div className="max-w-3xl mx-auto shadow-sm border rounded-sm mt-8 px-4 py-8 text-center">
      <h1 className="font-serif text-3xl mb-4">Confirmation de paiement</h1>
      {currentOrderQuery.data?.status === 'paid' && (
        <>
          <p>Votre paiement a bien été pris en compte.</p>
          <p className="mt-2">
            <span className="font-bold">Merci</span> pour votre commande !
          </p>
        </>
      )}
      {/* {currentSessionQuery.data?.type === 'error' && (
        <>
          <p>
            Oups une erreur est survenue, nous avons reçu une alerte et allons
            nous occuper de vous au plus vite ! N&apos;hésitez pas à me
            contacter pour être tenue au courrant de l&apos;avancement de la
            solution.
          </p>
        </>
      )} */}
      {currentOrderQuery.data?.status === 'draft' && (
        <>
          <p>Votre paiement a bien été pris en compte.</p>
          <div className="flex items-center justify-center my-8">
            <Spinner className="w-6 h-6" />
          </div>
          <p>Enregistrement de votre commande...</p>
        </>
      )}
      {currentOrderQuery.isLoading && (
        <>
          <div className="flex items-center justify-center my-8">
            <Spinner className="w-6 h-6" />
          </div>
          <p>Chargement de votre commande...</p>
        </>
      )}
    </div>
  );
}
