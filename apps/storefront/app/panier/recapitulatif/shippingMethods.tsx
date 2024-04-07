import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { RadioGroup } from '@headlessui/react';
import clsx from 'clsx';
import { HTMLProps, useEffect, useMemo } from 'react';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { useQuery } from '@tanstack/react-query';
import { CallGetShippingPricesPayload, CallGetShippingPricesResponse } from '@couture-next/types';
import { BoxtalCarriers } from '@couture-next/shipping';
import { useCart } from 'apps/storefront/contexts/CartContext';
import { Offers, fetchFromCMS } from 'apps/storefront/directus';
import { StorageImage } from '../../StorageImage';
import { cartTotalTaxIncludedWithOutGiftCards } from '@couture-next/utils';

const SHIPPING_METHODS = {
  'pickup-at-workshop': {
    boxtalCarrierId: undefined,
    label: "Retrait à l'atelier",
    iconUri: 'public/images/pickupAtWorkshop.svg',
  },
  colissimo: {
    boxtalCarrierId: BoxtalCarriers.COLISSIMO,
    label: 'Colissimo',
    iconUri: 'public/images/colissimo.jpg',
  },
  'mondial-relay': {
    boxtalCarrierId: BoxtalCarriers.MONDIAL_RELAY,
    label: 'Mondial Relay',
    iconUri: 'public/images/mondialrelay.svg',
  },
} satisfies {
  [key in NonNullable<FinalizeFormType['shipping']>['method']]: {
    boxtalCarrierId?: BoxtalCarriers;
    label: string;
    iconUri: string;
  };
};

type Props = {
  setValue: UseFormSetValue<FinalizeFormType>;
  watch: UseFormWatch<FinalizeFormType>;
  setShippingCost: (cost: number) => void;
  currentPromotionCodeDiscount: number;
} & HTMLProps<HTMLDivElement>;

export default function ShippingMethods({
  watch,
  setValue,
  setShippingCost,
  currentPromotionCodeDiscount,
  ...htmlProps
}: Props) {
  const functions = useFunctions();
  const fetchPrices = useMemo(
    () =>
      httpsCallable<CallGetShippingPricesPayload, CallGetShippingPricesResponse>(functions, 'callGetShippingPrices'),
    [functions]
  );

  const cart = useCart();

  const offersFromCmsQuery = useQuery({
    queryKey: ['cms', 'offers'],
    queryFn: () => fetchFromCMS<Offers>('offers'),
  });

  const freeShippingThreshold = offersFromCmsQuery.data?.freeShippingThreshold ?? null;
  const offerShipping =
    freeShippingThreshold !== null &&
    cartTotalTaxIncludedWithOutGiftCards(cart.getCartQuery.data ?? null) - currentPromotionCodeDiscount >=
      freeShippingThreshold;

  const getPricesQuery = useQuery({
    queryKey: ['shipping', 'prices', cart.getCartQuery.data?.totalWeight],
    queryFn: async () => {
      const response = await fetchPrices({ weight: cart.getCartQuery.data?.totalWeight || 0 });
      return response.data;
    },
    enabled: !!cart.getCartQuery.data && cart.getCartQuery.data?.totalWeight > 0, // && !offerShipping && offersFromCmsQuery.isSuccess,
  });
  if (getPricesQuery.isError) throw getPricesQuery.error;

  useEffect(() => {
    const boxtalCarrierId = watch('shipping.method')
      ? SHIPPING_METHODS[watch('shipping.method')].boxtalCarrierId
      : undefined;
    setShippingCost(boxtalCarrierId && !offerShipping ? getPricesQuery.data?.[boxtalCarrierId] ?? 0 : 0);
  }, [getPricesQuery.data, watch('shipping.method'), offerShipping]);

  if (cart.getCartQuery.data?.totalWeight === 0) return null;

  return (
    <>
      <RadioGroup
        {...htmlProps}
        as="div"
        ref={undefined}
        className={clsx(
          htmlProps.className,
          'grid md:grid-cols-3 md:max-w-4xl max-w-lg md:gap-2 lg:gap-4 gap-4 mt-8 w-full'
        )}
        onChange={(value) => setValue('shipping.method', value as NonNullable<FinalizeFormType['shipping']>['method'])}
      >
        <RadioGroup.Label className="col-span-full text-center underline" as="h2">
          Choix du mode de livraison
        </RadioGroup.Label>
        {Object.entries(SHIPPING_METHODS).map(([methodKey, method]) => (
          <RadioGroup.Option
            key={methodKey}
            value={methodKey}
            className="btn-secondary border-current ui-not-checked:text-black flex items-center gap-4"
          >
            <StorageImage
              unoptimized
              src={method.iconUri}
              alt=""
              aria-hidden
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span>{method.label}</span>
            <span
              className={clsx(
                method.boxtalCarrierId === BoxtalCarriers.MONDIAL_RELAY && offerShipping && 'line-through',
                'ml-auto'
              )}
            >
              {method.boxtalCarrierId ? getPricesQuery.data?.[method.boxtalCarrierId] : '0.00'}€
            </span>
            {!getPricesQuery.data && !!method.boxtalCarrierId && (
              <>
                <span className="sr-only">Chargement du prix...</span>
                <span className="placeholder text-transparent bg-gray-100 ml-auto" aria-hidden>
                  00.00€
                </span>
              </>
            )}
          </RadioGroup.Option>
        ))}
      </RadioGroup>
      {offerShipping && (
        <p className="font-bold text-primary-100 -mt-4 mb-4">
          Nous vous offrons les frais de port 🧡{' '}
          <small className="block text-black text-center">Mondial relay, France uniquement</small>
        </p>
      )}
    </>
  );
}
