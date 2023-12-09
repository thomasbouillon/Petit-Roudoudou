import { UseFormSetValue } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { RadioGroup } from '@headlessui/react';
import Image from 'next/image';
import clsx from 'clsx';
import { HTMLProps, useMemo } from 'react';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { useQuery } from '@tanstack/react-query';
import { CallGetShippingPricesPayload, CallGetShippingPricesResponse } from '@couture-next/types';
import { BoxtalCarriers } from '@couture-next/shipping';
import { useCart } from 'apps/storefront/contexts/CartContext';

const SHIPPING_METHODS = {
  colissimo: {
    boxtalCarrierId: BoxtalCarriers.COLISSIMO,
    label: 'Colissimo',
    iconUri: '/images/colissimo.jpg',
  },
  'mondial-relay': {
    boxtalCarrierId: BoxtalCarriers.MONDIAL_RELAY,
    label: 'Mondial Relay',
    iconUri: '/images/mondialrelay.svg',
  },
} satisfies {
  [key in FinalizeFormType['shipping']['method']]: {
    boxtalCarrierId: BoxtalCarriers;
    label: string;
    iconUri: string;
  };
};

type Props = {
  setValue: UseFormSetValue<FinalizeFormType>;
} & HTMLProps<HTMLDivElement>;

export default function ShippingMethods({ setValue, ...htmlProps }: Props) {
  const functions = useFunctions();
  const fetchPrices = useMemo(
    () =>
      httpsCallable<CallGetShippingPricesPayload, CallGetShippingPricesResponse>(functions, 'callGetShippingPrices'),
    [functions]
  );

  const cart = useCart();

  const getPricesQuery = useQuery({
    queryKey: ['shipping', 'prices', cart.getCartQuery.data?.totalWeight],
    queryFn: async () => {
      const response = await fetchPrices({ weight: cart.getCartQuery.data?.totalWeight || 0 });
      return response.data;
    },
    enabled: !!cart.getCartQuery.data,
  });
  if (getPricesQuery.isError) throw getPricesQuery.error;

  return (
    <RadioGroup
      {...htmlProps}
      as="div"
      ref={undefined}
      className={clsx(htmlProps.className, 'grid md:grid-cols-2 max-w-2xl gap-4 mt-8 w-full')}
      onChange={(value) => setValue('shipping.method', value as FinalizeFormType['shipping']['method'])}
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
          <Image unoptimized src={method.iconUri} alt="" aria-hidden width={32} height={32} className="w-8 h-8" />
          <span>{method.label}</span>
          <span className="ml-auto">{getPricesQuery.data?.[method.boxtalCarrierId]}€</span>
          {!getPricesQuery.data && (
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
  );
}
