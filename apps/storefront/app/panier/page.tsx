'use client';

import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import clsx from 'clsx';
import useFunctions from '../../hooks/useFunctions';
import { useCallback, useState } from 'react';
import {
  CallGetCartPaymentUrlPayload,
  CallGetCartPaymentUrlResponse,
} from '@couture-next/types';
import { httpsCallable } from 'firebase/functions';
import { useQuery } from '@tanstack/react-query';
import { ButtonWithLoading, CartItemLine, Spinner } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import ShippingFields from './shippingFields';
import BillingFields from './billingFields';
import { zodResolver } from '@hookform/resolvers/zod';

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
});

export type FormSchema = z.infer<typeof schema>;

export default function Page() {
  const { getCartQuery } = useCart();

  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
  });
  if (getCartQuery.isError) throw getCartQuery.error;

  const functions = useFunctions();
  const [isFetchingPaymentUrl, setIsFetchingPaymentUrl] = useState(false);
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

  if (getCartQuery.isFetching) return <div>Chargement...</div>;

  const itemsQuantity = getCartQuery.data?.items.length ?? 0;
  const cartDesc =
    itemsQuantity === 0
      ? 'Votre panier est vide.'
      : itemsQuantity === 1
      ? '1 article'
      : `${itemsQuantity} articles`;

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsFetchingPaymentUrl(true);
    const paymentUrl = await fetchPaymentUrl({
      billing: data.billing,
      shipping: {
        ...data.shipping,
        method: 'colissimo',
      },
    }).finally(() => setIsFetchingPaymentUrl(false));
    window.location.href = paymentUrl;
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
          <CartItemLine key={i} item={item} />
        ))}
      </div>
      {!!getCartQuery.data?.items.length && (
        <>
          <div className="p-8 border-b">
            <h2 className="text-2xl font-serif text-center mt-4 mb-2 px-4">
              Informations de livraison
            </h2>
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
          <ButtonWithLoading
            loading={isFetchingPaymentUrl}
            className="btn-primary mx-auto"
            type="submit"
          >
            Paiement
          </ButtonWithLoading>
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

const PaymentButton: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const functions = useFunctions();
  const fetchPaymentUrl = useCallback(async () => {
    const mutate = httpsCallable<
      CallGetCartPaymentUrlPayload,
      CallGetCartPaymentUrlResponse
    >(functions, 'callGetCartPaymentUrl');
    return await mutate().then((r) => r.data);
  }, [functions]);

  const getPaymentUrlQuery = useQuery(
    ['order.payment'], // TODO refresh on cart change
    fetchPaymentUrl,
    { enabled: !disabled }
  );

  if (getPaymentUrlQuery.isError) throw getPaymentUrlQuery.error;
  if (getPaymentUrlQuery.isFetching)
    return (
      <div className="relative btn-primary mx-auto mt-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="sr-only">Chargement...</span>
          <Spinner className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-transparent" aria-hidden>
          Paiement
        </div>
      </div>
    );
  return (
    <Link
      href={disabled ? '#' : getPaymentUrlQuery.data ?? '#'}
      onClick={(e) => disabled && e.preventDefault()}
      className={clsx(
        'btn-primary mx-auto mt-4',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      Paiement
    </Link>
  );
};
