'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import MondialRelay from './mondialRelay';
import Colissimo from './colissimo';
import ShippingMethods from './shippingMethods';
import { ButtonWithLoading } from '@couture-next/ui';
import clsx from 'clsx';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { useCallback } from 'react';
import {
  CallGetCartPaymentUrlPayload,
  CallGetCartPaymentUrlResponse,
  CallPayByBankTransferPayload,
  CallPayByBankTransferResponse,
} from '@couture-next/types';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { RadioGroup } from '@headlessui/react';
import { BuildingLibraryIcon, CheckCircleIcon, CreditCardIcon } from '@heroicons/react/24/solid';
import Billing from './billing';
import { routes } from '@couture-next/routing';

const detailsSchema = z.object({
  civility: z.enum(['M', 'Mme']),
  firstName: z.string().min(1, 'Le prénom est obligatoire'),
  lastName: z.string().min(1, 'Le nom est obligatoire'),
  address: z.string().min(1, "L'adresse est obligatoire"),
  addressComplement: z.string(),
  city: z.string().min(1, 'La ville est obligatoire'),
  zipCode: z.string().min(1, 'Le code postal est obligatoire'),
  country: z.string().min(1, 'Le pays est obligatoire'),
});

const shippingSchema = z.intersection(
  detailsSchema,
  z.union([
    z.object({
      method: z.enum(['mondialrelay' /* 'retrait' */]),
      pickupPoint: z.any(),
    }),
    z.object({
      method: z.enum(['colissimo']),
    }),
  ])
);

const schema = z.object({
  shipping: shippingSchema,
  billing: detailsSchema.nullish(),
  payment: z.object({
    method: z.enum(['card', 'bank-transfer']),
  }),
});

export type DetailsFormType = z.infer<typeof detailsSchema>;
export type FinalizeFormType = z.infer<typeof schema>;

export default function Page() {
  const form = useForm<FinalizeFormType>({
    defaultValues: {
      shipping: {
        civility: 'Mme',
        country: 'France',
      },
      billing: null,
    },
    resolver: zodResolver(schema),
  });
  const router = useRouter();

  const functions = useFunctions();
  const fetchPaymentUrl = useCallback(
    async (data: CallGetCartPaymentUrlPayload) => {
      const mutate = httpsCallable<CallGetCartPaymentUrlPayload, CallGetCartPaymentUrlResponse>(
        functions,
        'callGetCartPaymentUrl'
      );
      return await mutate(data).then((r) => r.data);
    },
    [functions]
  );

  const payByBankTransfer = useCallback(
    async (data: CallPayByBankTransferPayload) => {
      const mutate = httpsCallable<CallPayByBankTransferPayload, CallPayByBankTransferResponse>(
        functions,
        'callPayByBankTransfer'
      );
      return await mutate(data).then((r) => r.data);
    },
    [functions]
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (data.payment.method === 'card') {
        const paymentUrl = await fetchPaymentUrl({
          billing: data.billing ?? data.shipping,
          shipping: {
            ...data.shipping,
            method: 'colissimo',
          },
        });
        window.location.href = paymentUrl;
      } else {
        const orderId = await payByBankTransfer({
          billing: data.billing ?? data.shipping,
          shipping: {
            ...data.shipping,
            method: 'colissimo',
          },
        });
        router.push(routes().cart().confirm(orderId));
      }
    } catch (e) {
      console.error(e);
    }
  });

  return (
    <form className="flex flex-col items-center p-8" onSubmit={handleSubmit}>
      <h1 className="text-3xl font-serif">Récapitulatif</h1>
      <ShippingMethods className="mb-8" setValue={form.setValue} />

      {form.watch('shipping.method') === 'mondialrelay' && (
        <div className="w-full">
          <MondialRelay
            register={form.register}
            onChange={(pickupPoint) => form.setValue('shipping.pickupPoint', pickupPoint)}
            value={form.watch('shipping.pickupPoint')}
          />
        </div>
      )}
      {form.watch('shipping.method') === 'colissimo' && <Colissimo register={form.register} />}
      <div className="w-full max-w-sm md:max-w-lg py-4 mt-2">
        {(form.watch('shipping.method') === 'colissimo' ||
          (form.watch('shipping.method') === 'mondialrelay' && !!form.watch('shipping.pickupPoint'))) && (
          <>
            <Billing {...form} />
            <RadioGroup
              value={form.watch('payment.method')}
              onChange={(value) => form.setValue('payment.method', value, { shouldValidate: true })}
              className="grid md:grid-cols-2 items-stretch gap-2 my-6"
            >
              <RadioGroup.Label as="h2" className="text-center col-span-full underline">
                Méthode de paiement
              </RadioGroup.Label>
              {paymentMethods.map(([method, methodLabel, renderIcon]) => (
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
          </>
        )}
        <ButtonWithLoading
          loading={form.formState.isSubmitting}
          className={clsx('btn-primary mx-auto mt-8', !form.formState.isValid && 'cursor-not-allowed opacity-50')}
          type="submit"
        >
          Payer
        </ButtonWithLoading>
      </div>
    </form>
  );
}

const paymentMethods = [
  ['card', 'Carte bancaire', () => <CreditCardIcon className="w-6 h-6" />],
  ['bank-transfer', 'Virement bancaire', () => <BuildingLibraryIcon className="w-6 h-6" />],
] as const;
