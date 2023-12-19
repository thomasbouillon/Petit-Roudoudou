'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import useDatabase from '../../../../hooks/useDatabase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { firestoreOrderConverter } from '@couture-next/utils';
import Image from 'next/image';
import clsx from 'clsx';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import { Difference, OrderItemCustomized, PaidOrder, Taxes, WaitingBankTransferOrder } from '@couture-next/types';
import { FormEvent, useCallback } from 'react';

export default function Page() {
  const params = useParams();
  const db = useDatabase();
  const orderQuery = useQuery({
    queryKey: ['order', params.id],
    queryFn: () =>
      getDoc(doc(collection(db, 'orders').withConverter(firestoreOrderConverter), params.id as string)).then((snap) => {
        if (!snap.exists()) throw new Error('Order not found');
        return snap.data();
      }),
    enabled: !!params.id,
  });

  const validatePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const orderRef = doc(collection(db, 'orders').withConverter(firestoreOrderConverter), id);
      await setDoc(
        orderRef,
        {
          status: 'paid',
          paymentMethod: 'bank-transfert',
          paidAt: new Date(),
        } satisfies Difference<PaidOrder<'bank-transfert'>, WaitingBankTransferOrder>,
        {
          merge: true,
        }
      );
    },
    onSuccess: () => {
      orderQuery.refetch();
    },
  });

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!orderQuery.data?._id) return;
      await validatePaymentMutation.mutateAsync(orderQuery.data._id);
    },
    [orderQuery.data?._id, validatePaymentMutation]
  );

  if (orderQuery.isError) throw orderQuery.error;
  if (orderQuery.isPending) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 rounded-sm border shadow-md">
      <h1 className="text-3xl text-center font-serif mb-8">Commande {orderQuery.data._id}</h1>
      {orderQuery.data.status === 'waitingBankTransfer' && (
        <form className="flex gap-4 mb-4" onSubmit={handleSubmit}>
          <div className="w-full hidden md:block"></div>
          <div className="w-full border rounded-sm pt-4">
            <h2 className="text-center">Cette commande est en attente de paiement.</h2>
            <button className="btn-light mx-auto">Valider le paiement</button>
          </div>
        </form>
      )}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de facturation</h2>
          <div>
            <p>
              Client: {orderQuery.data.billing.firstName} {orderQuery.data.billing.lastName}
            </p>
            {orderQuery.data.status === 'paid' && (
              <p>
                Payée le {orderQuery.data.paidAt.toLocaleDateString()} par {orderQuery.data.paymentMethod}
              </p>
            )}
            {orderQuery.data.status === 'waitingBankTransfer' && (
              <p className="text-primary-100">Commande en attente de reception du virement bancaire.</p>
            )}
          </div>
          <div className="flex flex-col">
            <p>Adresse:</p>
            <p>{orderQuery.data.billing.address}</p>
            <p className="empty:hidden">{orderQuery.data.billing.addressComplement}</p>
            <div>
              {orderQuery.data.billing.zipCode} {orderQuery.data.billing.city}
            </div>
            <p>{orderQuery.data.billing.country}</p>
          </div>
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de livraison</h2>
          <p>
            Client: {orderQuery.data.shipping.firstName} {orderQuery.data.shipping.lastName}
          </p>
          <div className="flex flex-col">
            <p>Adresse:</p>
            <p>{orderQuery.data.shipping.address}</p>
            <p className="empty:hidden">{orderQuery.data.shipping.addressComplement}</p>
            <div>
              {orderQuery.data.shipping.zipCode} {orderQuery.data.shipping.city}
            </div>
            <p>{orderQuery.data.shipping.country}</p>
          </div>
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Paiement</h2>
          <p>Sous total HT: {orderQuery.data.subTotalTaxExcluded} €</p>
          <p>Frais de port HT: {orderQuery.data.shipping.price.taxExcluded} €</p>
          {!!orderQuery.data.extras.reduceManufacturingTimes && (
            <p>Sup. urgent HT: {orderQuery.data.extras.reduceManufacturingTimes.price.priceTaxExcluded} €</p>
          )}
          <p className="flex flex-col">
            Taxes:{' '}
            {Object.entries(orderQuery.data.taxes).map(([taxId, taxAmount]) => (
              <span>
                {parseInt(taxId) === Taxes.VAT_20 ? 'TVA 20%' : ''}: {taxAmount} €
              </span>
            ))}
          </p>
          <p>Total TTC: {orderQuery.data.totalTaxIncluded} €</p>
        </div>
      </div>
      <div className="mt-6 border rounded-sm p-4">
        <h2 className="text-xl font-bold text-center">Articles</h2>
        <ul
          className={clsx(
            'grid place-content-center mt-8 gap-4',
            orderQuery.data.items.length > 1 && 'grid-cols-[repeat(auto-fill,30rem)]'
          )}
        >
          {orderQuery.data.items.map((item, i) => (
            <li key={i} className="flex items-center gap-4">
              <Image
                width={256}
                height={256}
                src={item.image.url}
                placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={item.image.placeholderDataUrl}
                loader={loader}
                alt=""
                className="w-64 h-64 object-contain object-center"
              />
              <div className="flex flex-col">
                <p className="text-xl font-bold">{item.description}</p>
                {item.customizations && <ItemCustomizations customizations={item.customizations} />}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ItemCustomizations({ customizations }: { customizations: OrderItemCustomized['customizations'] }) {
  const groupedByCustomizationType = Object.entries(customizations).reduce((acc, [customizationId, choice]) => {
    if (!acc[choice.type]) acc[choice.type] = {};
    acc[choice.type][customizationId] = choice;
    return acc;
  }, {} as Record<string, Record<string, OrderItemCustomized['customizations'][number]>>);

  return (
    <ul className="flex flex-col gap-2">
      {Object.entries(groupedByCustomizationType).map(([type, choices]) => (
        <li key={type} className="flex flex-col">
          {type === 'fabric' && <h3 className="font-bold">Tissus</h3>}
          {Object.entries(choices).map(([customizationId, choice]) => (
            <p key={customizationId}>
              {choice.title}: {choice.value}
            </p>
          ))}
        </li>
      ))}
    </ul>
  );
}
