import { Listbox, RadioGroup } from '@headlessui/react';
import { Controller, useController, useFormContext, useWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { BuildingLibraryIcon, CheckCircleIcon, CreditCardIcon, GiftIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import useDatabase from 'apps/storefront/hooks/useDatabase';
import { useAuth } from 'apps/storefront/contexts/AuthContext';
import { firestoreGiftCardConverter } from '@couture-next/utils';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import { useCallback, useEffect, useMemo, useRef } from 'react';

const paymentMethods = [
  ['card', 'Carte bancaire', () => <CreditCardIcon className="w-6 h-6" />],
  ['bank-transfer', 'Virement bancaire', () => <BuildingLibraryIcon className="w-6 h-6" />],
] as const;

const giftCardPaymentMethod = ['gift-card', 'Carte cadeau', () => <GiftIcon className="w-6 h-6" />] as const;
const giftCardPaymentMethods = [giftCardPaymentMethod];

type Props = {
  cartTotal: number;
};

export function PaymentMethods({ cartTotal }: Props) {
  const giftCards = useWatch<FinalizeFormType>({
    name: 'payment.giftCards',
  });

  const { setValue } = useFormContext();

  const remainingAmount = useMemo(
    () => Math.max(0, cartTotal - Object.values(giftCards as Record<string, number>).reduce((acc, v) => acc + v, 0)),
    [cartTotal, giftCards]
  );

  const allowedMethods = useMemo(() => {
    if (remainingAmount === 0 && Object.keys(giftCards ?? {})) return giftCardPaymentMethods;
    return paymentMethods;
  }, [remainingAmount, giftCards]);

  useEffect(() => {
    setValue('payment.method', undefined);
  }, [setValue, allowedMethods]);

  return (
    <div>
      <GiftCards />
      <Controller<FinalizeFormType>
        name="payment.method"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            className="grid md:grid-cols-2 items-stretch gap-2 my-6"
          >
            <RadioGroup.Label as="h2" className="text-center col-span-full underline">
              Méthode de paiement
            </RadioGroup.Label>
            {allowedMethods.map(([method, methodLabel, renderIcon]) => (
              <RadioGroup.Option key={method} value={method} className="btn relative">
                <div className="flex gap-2 justify-center">
                  {renderIcon()}
                  <span>{methodLabel}</span>
                  <CheckCircleIcon
                    className={clsx(
                      'w-6 h-6 ml-auto ui-not-checked:hidden text-primary-100',
                      'absolute left-full top-1/2 -translate-y-1/2 translate-x-2',
                      'md:left-auto md:right-2 md:translate-x-0'
                    )}
                  />
                </div>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        )}
      />
    </div>
  );
}

const GiftCards = () => {
  const database = useDatabase();
  const { userQuery } = useAuth();
  const giftCardsQuery = useQuery({
    queryKey: ['giftCards'],
    queryFn: () =>
      getDocs(
        query(
          collection(database, 'giftCards').withConverter(firestoreGiftCardConverter),
          where('userId', '==', userQuery.data?.uid ?? '')
        )
      )
        .then((res) => res.docs.map((doc) => doc.data()))
        .then((giftCards) =>
          giftCards.filter(
            (giftCard) =>
              giftCard.consumedAmount < giftCard.amount &&
              giftCard.createdAt.getTime() + 1000 * 60 * 60 * 24 * 365 > Date.now()
          )
        ),
    enabled: !!userQuery.data?.uid,
  });

  const { field } = useController({
    name: 'payment.giftCards',
    defaultValue: {},
  });

  const extendedValue = useMemo(() => Object.keys(field.value), [field.value]);

  const extendedOnChange = useCallback(
    (v: string[]) => {
      const next = v.reduce((acc, selectedId) => {
        console.log(JSON.stringify(giftCardsQuery.data, null, 2));
        const giftCard = giftCardsQuery.data?.find((gc) => gc._id === selectedId);
        if (!giftCard) return acc;
        acc[selectedId] = giftCard.amount;
        return acc;
      }, {} as Record<string, number>);
      console.log(v, next);
      field.onChange(next);
    },
    [field.onChange, giftCardsQuery.data]
  );

  if (!giftCardsQuery.data?.length) return null;
  return (
    <Listbox multiple value={extendedValue} onChange={extendedOnChange}>
      <Listbox.Label className="block mt-6 text-center underline mb-2">Utiliser une carte cadeau</Listbox.Label>
      <Listbox.Options static>
        {giftCardsQuery.data?.map((giftCard) => (
          <Listbox.Option
            key={giftCard._id}
            value={giftCard._id}
            className="flex items-center gap-2 p-2 border rounded-md !outline-none cursor-pointer"
          >
            <Image src={giftCard.image.url} width={128} height={64} alt="Carte cadeau" loader={loader} />
            <span>Carte cadeau</span>
            <span>({giftCard.amount - giftCard.consumedAmount} € restants)</span>
            <CheckCircleIcon className="w-6 h-6 ml-auto hidden ui-selected:block text-primary-100" />
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};
