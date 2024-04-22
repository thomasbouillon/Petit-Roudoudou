import { useFormContext, useWatch } from 'react-hook-form';
import { FinalizeFormType } from '../page';
import { trpc } from 'apps/storefront/trpc-client';
import { TRPCRouterOutput } from '@couture-next/api-connector';
import { ChooseShippingOfferWidget } from './ChooseShippingOffer';
import toast from 'react-hot-toast';
import ChoosePickupPoint from './ChoosePickupPoint';
import ShippingAtHomeFields from './ShippingAtHomeFields';
import { useCart } from 'apps/storefront/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { fetchFromCMS } from 'apps/storefront/directus';
import { Offers } from '@couture-next/cms';
import { useMemo } from 'react';

type Props = {
  onShippingCostChanged: (n: number) => void;
};

export type ShippingOffer = NonNullable<TRPCRouterOutput['shipping']['getAvailableOffersForMyCart'][number]>;

export default function ChooseShipping({ onShippingCostChanged }: Props) {
  const { register } = useFormContext<FinalizeFormType>();
  const { offerShipping } = useCart();

  const shipToCountry = useWatch<FinalizeFormType, 'shipping.country'>({
    name: 'shipping.country',
    defaultValue: 'FR',
  });

  const selectedDeliveryMode = useWatch<FinalizeFormType, 'shipping.deliveryMode'>({ name: 'shipping.deliveryMode' });

  const shippingOffersQuery = trpc.shipping.getAvailableOffersForMyCart.useQuery({
    country: shipToCountry,
  });

  if (shippingOffersQuery.isError) {
    toast.error('Impossible de récupérer les différentes options livraison');
    throw shippingOffersQuery.error;
  }

  return (
    <div>
      {!shippingOffersQuery.isPending && !shippingOffersQuery.data.length && shipToCountry === 'CH' && (
        <p className="mt-8 max-w-md">
          Notre partenaire qui s'occupe de la livraison ne propose pas d'offre pour la Suisse en ce moment. Contacte moi
          directement par instagram ou avec le chat en ligne pour que je t'explique comment procéder.
        </p>
      )}
      {!shippingOffersQuery.isPending && !shippingOffersQuery.data.length && shipToCountry !== 'CH' && (
        <p className="mt-8 max-w-md">
          Oups, pas livraison possible 😱
          <br /> Il s'agit surement d'un problème de notre côté, contacte moi par instagram ou avec le chat en ligne
          pour te débloquer
        </p>
      )}
      <ChooseShippingOfferWidget
        shippingOffers={shippingOffersQuery.data}
        onShippingCostChanged={onShippingCostChanged}
      />
      {offerShipping && (
        <p className="font-bold text-primary-100 my-4 text-center">
          🎉 Merveilleux ! On t'offre les frais de port 🎉{' '}
          <small className="block text-black text-center">En point relais, France et Belgique uniquement</small>
        </p>
      )}
      <div className="flex max-w-md mx-auto mt-6 items-center gap-2">
        <p className="text-pretty">Tu n'habites pas en france ? Pas de soucis, change le pays de livraison</p>
        <label>
          <span className="sr-only">Pays</span>
          <select className="p-4" {...register('shipping.country')}>
            <option value="FR">France</option>
            <option value="BE">Belgique</option>
            <option value="CH">Suisse</option>
          </select>
        </label>
      </div>
      <div className="mt-6">
        {(selectedDeliveryMode === 'deliver-at-pickup-point' && <ChoosePickupPoint />) ||
          (selectedDeliveryMode === 'deliver-at-home' && <ShippingAtHomeFields />)}
      </div>
    </div>
  );
}
