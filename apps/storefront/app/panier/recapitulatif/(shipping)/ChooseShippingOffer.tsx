import React, { useCallback } from 'react';
import { ShippingOffer } from './ChooseShipping';
import { RadioGroup } from '@headlessui/react';
import clsx from 'clsx';
import { useFormContext, useWatch } from 'react-hook-form';
import { FinalizeFormType } from '../page';

type Props = {
  shippingOffers: ShippingOffer[] | undefined;
  onShippingCostChanged: (n: number) => void;
};

const getDeliveryModeLabel = (mode: ShippingOffer['deliveryType']) =>
  mode === 'deliver-at-home'
    ? 'Livraison à domicile'
    : mode === 'deliver-at-pickup-point'
    ? 'Livraison en point relais'
    : null;

export const ChooseShippingOfferWidget: React.FC<Props> = ({ shippingOffers, onShippingCostChanged }) => {
  if (shippingOffers === undefined) return <LoadingPlaceholder />;

  const selectedOfferId = useWatch<FinalizeFormType, 'shipping.offerId'>({ name: 'shipping.offerId' });
  const { setValue } = useFormContext<FinalizeFormType>();

  const setOfferIdValue = useCallback(
    (v: string) => {
      const selected = shippingOffers.find((offer) => offer.offerId === v);
      if (!selected) return;
      setValue('shipping.deliveryMode', selected.deliveryType);
      setValue('shipping.offerId', selected.offerId);
      setValue('shipping.carrierId', selected.carrierId);
      onShippingCostChanged(selected.price.taxIncluded);
    },
    [setValue, shippingOffers]
  );

  return (
    <RadioGroup
      as="div"
      ref={undefined}
      className={clsx('grid lg:grid-cols-3 md:max-w-4xl max-w-lg gap-4 mt-8 w-full')}
      value={selectedOfferId}
      onChange={setOfferIdValue}
    >
      <RadioGroup.Label className="col-span-full text-center underline" as="h2">
        Choix du mode de livraison
      </RadioGroup.Label>
      {shippingOffers.map((shippingOffer) => (
        <RadioGroup.Option
          key={shippingOffer.offerId}
          value={shippingOffer.offerId}
          className="btn-secondary border-current ui-not-checked:text-black flex items-center gap-4 !outline-none"
        >
          <img src={shippingOffer.carrierIconUrl} width={70} height={40} aria-hidden />
          <div>
            <RadioGroup.Label>{shippingOffer.carrierLabel}</RadioGroup.Label>
            <small aria-hidden className="block">
              {getDeliveryModeLabel(shippingOffer.deliveryType)}
            </small>
          </div>
          <RadioGroup.Description
            className={clsx(
              // method.boxtalCarrierId === BoxtalCarriers.MONDIAL_RELAY && offerShipping && 'line-through',
              'ml-auto'
            )}
          >
            <p className="sr-only">Mode de livraison: {getDeliveryModeLabel(shippingOffer.deliveryType)}</p>
            {shippingOffer.price.taxIncluded.toFixed(2)}€
          </RadioGroup.Description>
        </RadioGroup.Option>
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