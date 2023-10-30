'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../storefront/contexts/AuthContext';
import useDatabase from '../../../../storefront/hooks/useDatabase';
import { useLiveFirestoreDocument } from '../../../../storefront/hooks/useLiveFirestoreDocument';
import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  collection,
  doc,
} from 'firebase/firestore';
import { CheckoutSession } from '@couture-next/types';
import { Spinner } from '@couture-next/ui';

const firestoreCheckoutSessionConverter: FirestoreDataConverter<
  CheckoutSession | null,
  CheckoutSession
> = {
  fromFirestore: (snap: QueryDocumentSnapshot) =>
    snap.data() as CheckoutSession | null,
  toFirestore: (checkoutSession: CheckoutSession) => checkoutSession,
};

export default function Page() {
  const { user } = useAuth();

  const database = useDatabase();
  const docRef = useMemo(
    () =>
      doc(
        collection(database, 'checkoutSessions'),
        user?.uid ?? 'will-not-be-used'
      ).withConverter(firestoreCheckoutSessionConverter),
    [database, user?.uid]
  );

  const currentSessionQuery = useLiveFirestoreDocument(
    ['checkoutSessions.find', user?.uid],
    docRef,
    {
      enabled: !!user?.uid,
    }
  );

  if (currentSessionQuery.isError) throw currentSessionQuery.error;

  return (
    <div className="max-w-3xl mx-auto shadow-sm border rounded-sm mt-8 px-4 py-8 text-center">
      <h1 className="font-serif text-3xl mb-4">Confirmation de paiement</h1>
      {!currentSessionQuery.data ||
        (currentSessionQuery.data?.type === 'paid' && (
          <>
            <p>Votre paiement a bien été pris en compte.</p>
            <p className="mt-2">
              <span className="font-bold">Merci</span> pour votre commande !
            </p>
          </>
        ))}
      {currentSessionQuery.data?.type === 'error' && (
        <>
          <p>
            Oups une erreur est survenue, nous avons reçu une alerte et allons
            nous occuper de vous au plus vite ! N&apos;hésitez pas à me
            contacter pour être tenue au courrant de l&apos;avancement de la
            solution.
          </p>
        </>
      )}
      {currentSessionQuery.data?.type === 'draft' && (
        <>
          <p>Votre paiement a bien été pris en compte.</p>
          <div className="flex items-center justify-center my-8">
            <Spinner className="w-6 h-6" />
          </div>
          <p>Enregistrement de votre commande...</p>
        </>
      )}
    </div>
  );
}
