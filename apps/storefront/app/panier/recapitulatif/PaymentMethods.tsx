import { Listbox, Popover, RadioGroup, Transition } from '@headlessui/react';
import { Controller, useController, useFormContext, useWatch } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { BuildingLibraryIcon, CheckCircleIcon, CreditCardIcon, GiftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import Image from 'next/image';
import { loader } from 'apps/storefront/utils/next-image-firebase-storage-loader';
import React, { useCallback, useEffect, useMemo } from 'react';
import { trpc } from 'apps/storefront/trpc-client';

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
    <div className="">
      <GiftCards />
      <Controller<FinalizeFormType>
        name="payment.method"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            className="grid md:grid-cols-2 items-stretch gap-2 mt-6"
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
      <HowToSplitPayment />
      <strong className="text-center mb-6 block">Total: {cartTotal.toFixed(2)}€</strong>
      {remainingAmount !== cartTotal && remainingAmount > 0 && (
        <strong className="text-center mb-6 block">Restant: {remainingAmount.toFixed(2)}€</strong>
      )}
    </div>
  );
}

const GiftCards = () => {
  const giftCardsQuery = trpc.giftCards.findOwned.useQuery(undefined, {
    select: (giftCards) =>
      giftCards.filter(
        (giftCard) =>
          giftCard.consumedAmount < giftCard.amount &&
          giftCard.createdAt.getTime() + 1000 * 60 * 60 * 24 * 365 > Date.now()
      ),
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
        const giftCard = giftCardsQuery.data?.find((gc) => gc.id === selectedId);
        if (!giftCard) return acc;
        acc[selectedId] = giftCard.amount - giftCard.consumedAmount;
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
            key={giftCard.id}
            value={giftCard.id}
            className="flex items-center gap-2 p-2 border rounded-md !outline-none cursor-pointer"
          >
            <Image src={giftCard.image.url} width={128} height={64} alt="Carte cadeau" loader={loader} />
            <span>Carte cadeau</span>
            <span>({(giftCard.amount - giftCard.consumedAmount).toFixed(2)} € restants)</span>
            <CheckCircleIcon className="w-6 h-6 ml-auto hidden ui-selected:block text-primary-100" />
          </Listbox.Option>
        ))}
      </Listbox.Options>
    </Listbox>
  );
};

const HowToSplitPayment = () => (
  <Popover>
    <Popover.Button className="btn-light mx-auto !outline-none">Comment payer en plusieurs fois ?</Popover.Button>
    <Transition
      as={React.Fragment}
      enter="transition duration-100"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition duration-75"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Popover.Overlay className="fixed inset-0 bg-black bg-opacity-20 z-20" />
    </Transition>
    <Transition
      as={React.Fragment}
      enter="transition duration-100"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition duration-75"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Popover.Panel
        className={clsx(
          'fixed z-20 w-11/12',
          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'bg-white border rounded-sm max-w-prose'
        )}
      >
        {({ close }) => (
          <div className="relative p-4">
            <h3 className="text-center font-serif text-2xl mb-6 px-10">Comment payer en plusieurs fois ?</h3>
            <button
              className="absolute top-2 right-0 !outline-none text-primary-100 p-4"
              onClick={() => close()}
              aria-label="Fermer"
              type="button"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <p className="text-pretty">
              Si vous souhaitez échelonner le paiement de votre commande, vous avez plusieurs options :
            </p>
            <ul className="list-disc list-outside pl-6 mt-2">
              <li>
                <strong>Carte bancaire</strong>: Choisissez "Carte bancaire", cliquez sur "Payer" et à l'étape suivante,
                vous devrez choisir "Klarna" dans la méthode de paiement.
              </li>
              <li>
                <strong>Virement bancaire</strong>: Choisissez "Virement bancaire", vous pourrez alors payer votre
                commande en plusieurs fois. Plus de détails seront fournis avec les instructions de paiement qui vous
                seront transmises.
              </li>
            </ul>
          </div>
        )}
      </Popover.Panel>
    </Transition>
  </Popover>
);
