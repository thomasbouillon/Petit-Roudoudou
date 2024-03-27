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
import { useCallback, useState } from 'react';
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
import Extras from './extras';
import PromotionCode from './promotionCode';
import Link from 'next/link';

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

const shippingSchema = z.union([
  z.intersection(
    detailsSchema,
    z.union([
      z.object({
        method: z.enum(['mondial-relay']),
        relayPoint: z.object({
          code: z.string(),
        }),
      }),
      z.object({
        method: z.enum(['colissimo']),
      }),
    ])
  ),
  z.object({
    method: z.enum(['pickup-at-workshop']),
  }),
]);

const schema = z.object({
  shipping: shippingSchema,
  billing: detailsSchema.nullish(),
  payment: z
    .object({
      method: z.enum(['card']),
      stripeTerms: z.boolean().refine(Boolean, 'Vous devez accepter les conditions de Stripe'),
    })
    .or(
      z.object({
        method: z.enum(['bank-transfer']),
        stripeTerms: z.any().optional(),
      })
    ),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
  promotionCode: z.string().optional(),
  cgv: z.boolean().refine(Boolean, 'Vous devez accepter les conditions générales de vente'),
});

export type DetailsFormType = z.infer<typeof detailsSchema>;
export type FinalizeFormType = z.infer<typeof schema>;

export default function Page() {
  const [shippingCost, setShippingCost] = useState(0);
  const [currentPromotionCodeDiscount, setCurrentPromotionCodeDiscount] = useState(0);

  const form = useForm<FinalizeFormType>({
    defaultValues: {
      shipping: {
        civility: 'Mme',
        country: 'France',
      },
      billing: null,
      extras: {
        reduceManufacturingTimes: false,
      },
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
    if (data.shipping.method === 'pickup-at-workshop' && data.billing === null) {
      throw 'Impossible';
    }
    try {
      if (data.payment.method === 'card') {
        const paymentUrl = await fetchPaymentUrl({
          billing: (data.billing ?? data.shipping) as CallGetCartPaymentUrlPayload['billing'],
          shipping: data.shipping,
          extras: data.extras,
          ...(data.promotionCode ? { promotionCode: data.promotionCode } : {}),
        });
        window.location.href = paymentUrl;
      } else {
        const orderId = await payByBankTransfer({
          billing: (data.billing ?? data.shipping) as CallPayByBankTransferPayload['billing'],
          shipping: data.shipping,
          extras: data.extras,
          ...(data.promotionCode ? { promotionCode: data.promotionCode } : {}),
        });
        router.push(routes().cart().confirm(orderId));
      }
    } catch (e) {
      console.error(e);
      form.setError('root', {
        type: 'manual',
        message: 'Une erreur est survenue lors du paiement',
      });
    }
  });

  return (
    <form className="flex flex-col items-center p-8" onSubmit={handleSubmit}>
      <h1 className="text-3xl font-serif">Récapitulatif</h1>
      <ShippingMethods
        className="mb-8"
        setValue={form.setValue}
        setShippingCost={setShippingCost}
        watch={form.watch}
        currentPromotionCodeDiscount={currentPromotionCodeDiscount}
      />
      {form.watch('shipping.method') === 'mondial-relay' && (
        <div className="w-full">
          <MondialRelay
            register={form.register}
            onChange={(pickupPointId) =>
              pickupPointId
                ? form.setValue('shipping.relayPoint.code', pickupPointId)
                : form.resetField('shipping.relayPoint.code')
            }
            value={form.watch('shipping.relayPoint.code')}
          />
        </div>
      )}
      {form.watch('shipping.method') === 'colissimo' && <Colissimo register={form.register} />}
      {form.watch('shipping.method') === 'pickup-at-workshop' && (
        <p className="font-bold">Nous nous donnerons rendez-vous sur la commune de Nancy (54000).</p>
      )}
      <div className="w-full max-w-sm md:max-w-lg py-4 mt-2">
        {(form.watch('shipping.method') === 'colissimo' ||
          form.watch('shipping.method') === 'pickup-at-workshop' ||
          (form.watch('shipping.method') === 'mondial-relay' && !!form.watch('shipping.relayPoint'))) && (
          <>
            <Billing {...form} />
            <Extras register={form.register} />
            <PromotionCode
              setValue={form.setValue}
              shippingCost={shippingCost}
              watch={form.watch}
              setDiscountAmount={setCurrentPromotionCodeDiscount}
            />
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
        {!!form.watch('shipping.method') && (
          <div className="text-sm max-w-sm mx-auto space-y-2">
            <label className="block">
              <input type="checkbox" className="mr-2" required {...form.register('cgv')} />
              Vous acceptez les{' '}
              <Link className="underline" href={routes().legal().cgv()}>
                conditions générales de vente
              </Link>{' '}
              pour passer commande chez Petit Roudoudou.
            </label>
            {form.formState.errors.cgv && <p className="text-red-500">{form.formState.errors.cgv.message}</p>}
            {form.watch('payment.method') === 'card' && (
              <label className="block">
                <input type="checkbox" className="mr-2" required {...form.register('payment.stripeTerms')} />
                Stripe est le service tier de utilisé pour procéder aux paiements par bancaire, vous acceptez leur{' '}
                <Link className="underline" href="https://stripe.com/fr/legal/ssa">
                  conditions générales
                </Link>{' '}
                ainsi que la transmission de vos données personnelles telles que votre nom, prénom, email et addresse de
                facturation pour passer commande chez Petit Roudoudou.
              </label>
            )}
            {form.formState.errors.payment?.stripeTerms?.message && (
              <p className="text-red-500">{form.formState.errors.payment.stripeTerms.message as string}</p>
            )}
          </div>
        )}

        <ButtonWithLoading
          loading={form.formState.isSubmitting}
          className={clsx('btn-primary mx-auto mt-8', !form.formState.isValid && 'cursor-not-allowed opacity-50')}
          type="submit"
        >
          Payer
        </ButtonWithLoading>

        {form.formState.errors.root && <p className="text-red-500 mt-4">{form.formState.errors.root.message}</p>}
      </div>
    </form>
  );
}

const paymentMethods = [
  ['card', 'Carte bancaire', () => <CreditCardIcon className="w-6 h-6" />],
  ['bank-transfer', 'Virement bancaire', () => <BuildingLibraryIcon className="w-6 h-6" />],
] as const;
