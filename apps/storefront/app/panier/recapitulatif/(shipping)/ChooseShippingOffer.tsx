import React, { useCallback, useEffect } from 'react';
import { ShippingOffer } from './ChooseShipping';
import { Description, Label, Radio, RadioGroup } from '@headlessui/react';
import clsx from 'clsx';
import { useFormContext, useWatch } from 'react-hook-form';
import { FinalizeFormType } from '../page';
import { useCart } from 'apps/storefront/contexts/CartContext';

type Props = {
  shippingOffers: ShippingOffer[] | undefined;
  onShippingCostChanged: (n: number) => void;
  shipToCountry: 'FR' | 'BE' | 'CH';
};

const getDeliveryModeLabel = (mode: ShippingOffer['deliveryType']) =>
  mode === 'deliver-at-home'
    ? 'Livraison à domicile'
    : mode === 'deliver-at-pickup-point'
    ? 'Livraison en point relais'
    : mode === 'pickup-at-workshop'
    ? '(Bayon, 54290)'
    : null;

export const ChooseShippingOfferWidget: React.FC<Props> = ({
  shipToCountry,
  shippingOffers,
  onShippingCostChanged,
}) => {
  const selectedOfferId = useWatch<FinalizeFormType, 'shipping.offerId'>({ name: 'shipping.offerId' });
  const { setValue, unregister } = useFormContext<FinalizeFormType>();
  const { offerShipping } = useCart();

  const setOfferIdValue = useCallback(
    (v: string) => {
      const selected = shippingOffers?.find((offer) => offer.offerId === v);
      if (!selected) return;
      setValue('shipping.deliveryMode', selected.deliveryType);
      setValue('shipping.offerId', selected.offerId);
      setValue('shipping.carrierId', selected.carrierId);
      const eligibleToFreeShipping =
        selected.carrierId === 'MONR' &&
        selected.deliveryType === 'deliver-at-pickup-point' &&
        offerShipping &&
        ['FR', 'BE'].includes(shipToCountry);
      onShippingCostChanged(eligibleToFreeShipping ? 0 : selected.price.taxIncluded);
    },
    [setValue, shippingOffers]
  );

  // Reset to undefined if the selected offer is not in the list anymore
  useEffect(() => {
    if (selectedOfferId) {
      unregister('shipping.offerId');
      unregister('shipping.carrierId');
      unregister('shipping.deliveryMode');
      onShippingCostChanged(0);
    }
  }, [shippingOffers]);

  if (shippingOffers === undefined) return <LoadingPlaceholder />;

  return (
    <RadioGroup
      as="div"
      ref={undefined}
      className={clsx('grid lg:grid-cols-2 md:max-w-4xl max-w-lg gap-4 mt-8 w-full')}
      value={selectedOfferId}
      onChange={setOfferIdValue}
    >
      <Label className="col-span-full text-center underline" as="h2">
        Choix du mode de livraison
      </Label>
      {shippingOffers.map((shippingOffer) => (
        <Radio
          key={shippingOffer.offerId}
          value={shippingOffer.offerId}
          className="btn-secondary border-current text-black data-[checked]:text-primary-100 flex items-center gap-3 !outline-none"
        >
          <img src={shippingOffer.carrierIconUrl} width={70} height={40} aria-hidden />
          <div>
            <Label>{shippingOffer.carrierLabel}</Label>
            <small aria-hidden className="block">
              {getDeliveryModeLabel(shippingOffer.deliveryType)}
            </small>
          </div>
          <Description
            className={clsx(
              offerShipping &&
                shippingOffer.carrierId === 'MONR' &&
                shippingOffer.deliveryType === 'deliver-at-pickup-point' &&
                'line-through',
              'ml-auto'
            )}
          >
            <p className="sr-only">Mode de livraison: {getDeliveryModeLabel(shippingOffer.deliveryType)}</p>
            {shippingOffer.price.taxIncluded.toFixed(2)}€
          </Description>
        </Radio>
      ))}
    </RadioGroup>
  );
};

const LoadingPlaceholder = () => (
  <div>
    <div className="grid lg:grid-cols-3 md:max-w-4xl max-w-lg md:gap-2 gap-4 mt-8 lg:w-[56rem]">
      <h2 className="col-span-full text-center underline">Choix du mode de livraison</h2>
      <div className="placeholder h-20 lg:h-32 bg-gray-100"></div>
      <div className="placeholder h-20 lg:h-32 bg-gray-100"></div>
      <div className="placeholder h-20 lg:h-32 bg-gray-100"></div>
    </div>
    <p className="sr-only">Chargement des différents modes de livraison...</p>
  </div>
);
