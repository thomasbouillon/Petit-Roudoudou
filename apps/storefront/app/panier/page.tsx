'use client';

import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import clsx from 'clsx';
import useFunctions from '../../hooks/useFunctions';
import { useCallback, useMemo } from 'react';
import {
  CallGetCartPaymentUrlPayload,
  CallGetCartPaymentUrlResponse,
  CallPayByBankTransferPayload,
  CallPayByBankTransferResponse,
} from '@couture-next/types';
import { httpsCallable } from 'firebase/functions';
import { ButtonWithLoading, CartItemLine } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import ShippingFields from './shippingFields';
import BillingFields from './billingFields';
import { zodResolver } from '@hookform/resolvers/zod';
import { loader } from '../../utils/next-image-firebase-storage-loader';
import { useAuth } from '../../contexts/AuthContext';
import ManufacturingTimes from '../manufacturingTimes';
import {
  BuildingLibraryIcon,
  CheckCircleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/solid';
import { RadioGroup } from '@headlessui/react';
import { useRouter } from 'next/navigation';

const schema = z.object({
  shipping: z.object({
    civility: z.enum(['M', 'Mme']),
    firstName: z.string().nonempty('Le prénom est obligatoire'),
    lastName: z.string().nonempty('Le nom est obligatoire'),
    address: z.string().nonempty("L'adresse est obligatoire"),
    addressComplement: z.string(),
    city: z.string().nonempty('La ville est obligatoire'),
    zipCode: z.string().nonempty('Le code postal est obligatoire'),
    country: z.string().nonempty('Le pays est obligatoire'),
  }),
  billing: z.object({
    civility: z.enum(['M', 'Mme']),
    firstName: z.string().nonempty('Le prénom est obligatoire'),
    lastName: z.string().nonempty('Le nom est obligatoire'),
    address: z.string().nonempty("L'adresse est obligatoire"),
    addressComplement: z.string(),
    city: z.string().nonempty('La ville est obligatoire'),
    zipCode: z.string().nonempty('Le code postal est obligatoire'),
    country: z.string().nonempty('Le pays est obligatoire'),
  }),
  payment: z.object({
    method: z.enum(['card', 'bank-transfer']),
  }),
});

export type FormSchema = z.infer<typeof schema>;

export default function Page() {
  const { getCartQuery } = useCart();
  const { userQuery } = useAuth();
  const router = useRouter();

  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
  });
  if (getCartQuery.isError) throw getCartQuery.error;

  const functions = useFunctions();
  const fetchPaymentUrl = useCallback(
    async (data: CallGetCartPaymentUrlPayload) => {
      const mutate = httpsCallable<
        CallGetCartPaymentUrlPayload,
        CallGetCartPaymentUrlResponse
      >(functions, 'callGetCartPaymentUrl');
      return await mutate(data).then((r) => r.data);
    },
    [functions]
  );

  const payByBankTransfer = useCallback(
    async (data: CallPayByBankTransferPayload) => {
      const mutate = httpsCallable<
        CallPayByBankTransferPayload,
        CallPayByBankTransferResponse
      >(functions, 'callPayByBankTransfer');
      return await mutate(data).then((r) => r.data);
    },
    [functions]
  );

  const containsCustomizedItems = useMemo(
    () => getCartQuery.data?.items.some((item) => item.type === 'customized'),
    [getCartQuery.data?.items]
  );

  if (getCartQuery.isFetching) return <div>Chargement...</div>;

  const itemsQuantity = getCartQuery.data?.items.length ?? 0;
  const cartDesc =
    itemsQuantity === 0
      ? 'Votre panier est vide.'
      : itemsQuantity === 1
      ? '1 article'
      : `${itemsQuantity} articles`;

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (data.payment.method === 'card') {
        const paymentUrl = await fetchPaymentUrl({
          billing: data.billing,
          shipping: {
            ...data.shipping,
            method: 'colissimo',
          },
        });
        window.location.href = paymentUrl;
      } else {
        const orderId = await payByBankTransfer({
          billing: data.billing,
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
    <form
      className={clsx(
        'max-w-3xl mx-auto py-8 md:border rounded-md md:shadow-sm my-20',
        (getCartQuery.data?.items.length ?? 0) > 0 && 'mt-8'
      )}
      onSubmit={handleSubmit}
    >
      <h1 className="text-4xl font-serif text-center mb-2 px-4">Panier</h1>
      <p className="text-center px-4">{cartDesc}</p>
      <div className="flex flex-col items-center border-t border-b mt-4 p-4 empty:hidden">
        {getCartQuery.data?.items.map((item, i) => (
          <CartItemLine key={i} item={item} imageLoader={loader} />
        ))}
      </div>
      {!!getCartQuery.data?.items.length && (
        <>
          <div className="p-8 border-b">
            <h2 className="text-2xl font-serif text-center mt-4 mb-2 px-4">
              Informations de livraison
            </h2>
            {containsCustomizedItems && (
              <ManufacturingTimes className="text-center mb-4" />
            )}
            <ShippingFields
              register={form.register}
              errors={form.formState.errors}
            />
          </div>
          <div className="p-8 border-b">
            <h2 className="text-2xl font-serif text-center mt-4 mb-2 px-4">
              Informations de facturation
            </h2>
            <BillingFields
              register={form.register}
              errors={form.formState.errors}
            />
          </div>
          <p className="text-xl text-center p-4">
            <span className="">Total: </span>
            <span className="font-bold">
              {getCartQuery.data?.totalTaxIncluded.toFixed(2)}€
            </span>
          </p>
          {userQuery.data?.isAnonymous ? (
            <>
              <p className="text-center font-bold mt-8">
                Vous devez être connecté pour passer commande.
              </p>
              <Link
                href={routes().auth().login(routes().cart().index())}
                className="btn-primary mx-auto mt-4"
              >
                Se connecter
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center border-t py-4">
              <RadioGroup
                value={form.watch('payment.method')}
                onChange={(value) => form.setValue('payment.method', value)}
                className="flex flex-col items-stretch gap-2 mb-6 px-8"
              >
                <RadioGroup.Label
                  as="h2"
                  className="text-center font-bold sr-only"
                >
                  Méthode de paiement
                </RadioGroup.Label>
                {paymentMethods.map(([method, methodLabel, renderIcon]) => (
                  <RadioGroup.Option
                    key={method}
                    value={method}
                    className="btn relative"
                  >
                    <div className="flex gap-2">
                      {renderIcon()}
                      <span>{methodLabel}</span>
                      <CheckCircleIcon className="w-6 h-6 ml-auto ui-not-checked:hidden text-primary-100 absolute left-full top-1/2 -translate-y-1/2 translate-x-2" />
                    </div>
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
              <ButtonWithLoading
                loading={form.formState.isSubmitting}
                className="btn-primary mx-auto flex"
                type="submit"
              >
                Payer
              </ButtonWithLoading>
            </div>
          )}
        </>
      )}
      {!getCartQuery.data?.items.length && (
        <Link
          href={routes().shop().index()}
          className="btn-primary mx-auto mt-4"
        >
          Voir toutes les créations
        </Link>
      )}
    </form>
  );
}

const paymentMethods = [
  ['card', 'Carte bancaire', () => <CreditCardIcon className="w-6 h-6" />],
  [
    'bank-transfer',
    'Virement bancaire',
    () => <BuildingLibraryIcon className="w-6 h-6" />,
  ],
] as const;
