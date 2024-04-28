'use client';

import { trpc } from 'apps/storefront/trpc-client';

export function GiftCards() {
  const giftCardsQuery = trpc.giftCards.findOwned.useQuery();

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-serif mb-6">Mes cartes cadeaux</h2>
      <div className="grid grid-cols-1 gap-4">
        {giftCardsQuery.data?.map((giftCard) => (
          <div key={giftCard.id} className="p-4 border rounded-sm">
            <p>Montant: {giftCard.amount.toFixed(2)} €</p>
            <p>Consommé: {giftCard.consumedAmount.toFixed(2)} €</p>
            <p>
              Créée le:{' '}
              {giftCard.createdAt.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {giftCard.consumedAmount >= giftCard.amount ? (
                <span className="text-yellow-600"> (entièrement utilisée)</span>
              ) : giftCard.createdAt.getTime() + 1000 * 60 * 60 * 24 * 365 > Date.now() ? (
                <span className="text-green-500"> (valide)</span>
              ) : (
                <span className="text-red-500"> (expirée)</span>
              )}
            </p>
          </div>
        ))}
        {giftCardsQuery.data?.length === 0 && <p className="text-center">Tu n'as pas encore reçu de carte cadeau.</p>}
      </div>
    </div>
  );
}
