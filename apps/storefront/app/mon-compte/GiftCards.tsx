'use client';

import { firestoreGiftCardConverter } from '@couture-next/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export function GiftCards() {
  const { userQuery } = useAuth();
  const database = useDatabase();

  const giftCardsQuery = useQuery({
    queryKey: ['giftCards', userQuery.data?.uid],
    queryFn: () =>
      getDocs(
        query(
          collection(database, 'giftCards').withConverter(firestoreGiftCardConverter),
          where('userId', '==', userQuery.data?.uid)
        )
      ).then((snapshot) => snapshot.docs.map((doc) => doc.data())),
  });

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-serif mb-6">Mes cartes cadeaux</h2>
      <div className="grid grid-cols-1 gap-4">
        {giftCardsQuery.data?.map((giftCard) => (
          <div key={giftCard._id} className="p-4 border rounded-sm">
            <p>Montant: {giftCard.amount.toFixed(2)} €</p>
            <p>Consommé: {giftCard.consumedAmount.toFixed(2)} €</p>
            <p>
              Créée le:{' '}
              {giftCard.createdAt.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {giftCard.createdAt.getTime() + 1000 * 60 * 60 * 24 * 365 > Date.now() ? (
                <span className="text-green-500"> (valide)</span>
              ) : (
                <span className="text-red-500"> (expirée)</span>
              )}
            </p>
          </div>
        ))}
        {giftCardsQuery.data?.length === 0 && (
          <p className="text-center">Vous n'avez pas encore reçu de carte cadeau.</p>
        )}
      </div>
    </div>
  );
}
