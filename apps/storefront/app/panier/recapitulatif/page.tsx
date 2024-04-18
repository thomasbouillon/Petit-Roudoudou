'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import MondialRelay from './mondialRelay';
import Colissimo from './colissimo';
import ShippingMethods from './shippingMethods';
import { ButtonWithLoading } from '@couture-next/ui';
import clsx from 'clsx';
import useFunctions from 'apps/storefront/hooks/useFunctions';
import { useCallback, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import Billing from './billing';
import { routes } from '@couture-next/routing';
import Extras from './extras';
import PromotionCode from './promotionCode';
import Link from 'next/link';
import useSetting from 'apps/storefront/hooks/useSetting';
import { useCart } from 'apps/storefront/contexts/CartContext';
import { cartContainsCustomizedItems } from '@couture-next/utils';
import { PaymentMethods } from './PaymentMethods';
import { trpc } from 'apps/storefront/trpc-client';
import { Civility } from '@prisma/client';
import { TRPCRouterInput } from '@couture-next/api-connector';

const detailsSchema = z.object({
  civility: z.nativeEnum(Civility),
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

const baseSchema = z.object({
  billing: detailsSchema.nullish(),
  payment: z.intersection(
    z
      .object({
        method: z.enum(['card']),
        stripeTerms: z.boolean().refine(Boolean, 'Vous devez accepter les conditions de Stripe'),
      })
      .or(
        z.object({
          method: z.enum(['bank-transfer']),
          stripeTerms: z.never().optional(),
        })
      )
      .or(
        z.object({
          method: z.enum(['gift-card']),
          stripeTerms: z.never().optional(),
        })
      ),
    z.object({
      giftCards: z.record(z.number()),
    })
  ),
  extras: z.object({
    reduceManufacturingTimes: z.boolean(),
  }),
  promotionCode: z.string().optional(),
  cgv: z.boolean().refine(Boolean, 'Vous devez accepter les conditions générales de vente'),
});

export type DetailsFormType = z.infer<typeof detailsSchema>;
export type FinalizeFormType = z.infer<typeof baseSchema> & {
  shipping?: z.infer<typeof shippingSchema>;
};

export default function Page() {
  const [shippingCost, setShippingCost] = useState(0);
  const [currentPromotionCodeDiscount, setCurrentPromotionCodeDiscount] = useState(0);
  const { getCartQuery } = useCart();

  const schema = useMemo(
    () =>
      !getCartQuery.data || getCartQuery.data.totalWeight > 0
        ? baseSchema.extend({ shipping: shippingSchema })
        : baseSchema,
    []
  );

  const form = useForm<FinalizeFormType>({
    defaultValues: {
      shipping: {
        civility: 'MRS',
        country: 'France',
      },
      billing: null,
      extras: {
        reduceManufacturingTimes: false,
      },
      payment: {
        giftCards: {},
      },
    },
    resolver: zodResolver(schema),
  });

  const total = useMemo(() => {
    if (!getCartQuery.data) return 0;
    return getCartQuery.data.totalTaxIncluded + shippingCost - currentPromotionCodeDiscount;
  }, [getCartQuery.data, shippingCost, currentPromotionCodeDiscount]);

  const router = useRouter();

  const functions = useFunctions();
  const createPaymentUrlMutation = trpc.payments.createPayByCardUrl.useMutation();

  const payByBankTransferMutation = trpc.payments.payByBankTransfer.useMutation();

  const payByGiftCard = useCallback(
    async (data: unknown) => {
      // TODO
    },
    [functions]
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    // make sure we have billing details if shipping method is pickup-at-workshop
    if (data.shipping?.method === 'pickup-at-workshop' && data.billing === null) {
      throw 'Impossible';
    }
    // make sure shipping was not asked if cart contains only digital items
    if (!getCartQuery.data || (getCartQuery.data.totalWeight > 0 && !data.shipping)) {
      throw 'Impossible';
    }
    try {
      if (data.payment.method === 'card') {
        const paymentUrl = await createPaymentUrlMutation.mutateAsync({
          billing: (data.billing ?? data.shipping) as TRPCRouterInput['payments']['createPayByCardUrl']['billing'],
          shipping: data.shipping === undefined ? { method: 'do-not-ship' } : data.shipping,
          giftCards: Object.keys(data.payment.giftCards),
          extras: data.extras,
          promotionCode: data.promotionCode ?? null,
        });
        window.location.href = paymentUrl;
      } else if (data.payment.method === 'bank-transfer') {
        const orderId = await payByBankTransferMutation.mutateAsync({
          billing: (data.billing ?? data.shipping) as TRPCRouterInput['payments']['payByBankTransfer']['billing'],
          giftCards: Object.keys(data.payment.giftCards),
          shipping: data.shipping === undefined ? { method: 'do-not-ship' } : data.shipping,
          extras: data.extras,
          promotionCode: data.promotionCode ?? null,
        });
        router.push(routes().cart().confirm(orderId));
      } else if (data.payment.method === 'gift-card') {
        //   const orderId = await payByGiftCard({
        //     billing: (data.billing ?? data.shipping) as CallPayByGiftCardPayload['billing'],
        //     giftCards: Object.keys(data.payment.giftCards),
        //     shipping: data.shipping === undefined ? { method: 'do-not-ship' } : data.shipping,
        //     extras: data.extras,
        //     ...(data.promotionCode ? { promotionCode: data.promotionCode } : {}),
        //   });
        //   router.push(routes().cart().confirm(orderId));
      }
    } catch (e) {
      console.error(e);
      form.setError('root', {
        type: 'manual',
        message: 'Une erreur est survenue lors du paiement',
      });
    }
  });

  // Redirect to cart if user has customized items in cart
  // and new orders with custom articles are not allowed
  const { getSettingValueQuery } = useSetting('allowNewOrdersWithCustomArticles');
  const hasCustomizedItems = getCartQuery.data ? cartContainsCustomizedItems(getCartQuery.data) : undefined;
  if (getSettingValueQuery.data === false && hasCustomizedItems) {
    router.push(routes().cart().index());
    return null;
  }
  if (getSettingValueQuery.isError) throw getSettingValueQuery.error;

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
      {getCartQuery.data?.totalWeight === 0 && (
        <p className="font-bold mt-4">
          Votre panier ne contient pas d'articles physiques, saisissez seulement les informations de facturations
        </p>
      )}
      <div className="w-full max-w-sm md:max-w-lg py-4 mt-2">
        {(form.watch('shipping.method') === 'colissimo' ||
          form.watch('shipping.method') === 'pickup-at-workshop' ||
          getCartQuery.data?.totalWeight === 0 ||
          (form.watch('shipping.method') === 'mondial-relay' && !!form.watch('shipping.relayPoint'))) && (
          <FormProvider {...form}>
            <Billing {...form} cartWeight={getCartQuery.data?.totalWeight} />
            <Extras />
            <PromotionCode
              setValue={form.setValue}
              shippingCost={shippingCost}
              watch={form.watch}
              setDiscountAmount={setCurrentPromotionCodeDiscount}
            />
            <PaymentMethods cartTotal={total} />
          </FormProvider>
        )}
        {(!!form.watch('shipping.method') || getCartQuery.data?.totalWeight === 0) && (
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
                <input
                  type="checkbox"
                  className="mr-2"
                  required
                  {...form.register('payment.stripeTerms', { shouldUnregister: true })}
                />
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
