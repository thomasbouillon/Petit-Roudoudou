'use client';

import { useMutation } from '@tanstack/react-query';
import useDatabase from '../../../../hooks/useDatabase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { firestoreOrderConverter } from '@couture-next/utils';
import Image from 'next/image';
import clsx from 'clsx';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import { Difference, OrderItemCustomized, PaidOrder, WaitingBankTransferOrder } from '@couture-next/types';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Popover, Transition } from '@headlessui/react';
import { Field } from '@couture-next/ui';
import { useFirestoreDocumentQuery } from 'apps/storefront/hooks/useFirestoreDocumentQuery';
import { ArchiveButton } from './ArchiveButton';
import Link from 'next/link';

const WorkflowStepComponent = ({ active, label }: { active: boolean; label: string }) => (
  <li
    className={clsx(
      'after:content-[">"] after:text-black after:font-normal after:inline-block after:ml-2 last:after:content-none',
      active && 'text-primary-100 font-semibold'
    )}
  >
    {label}
  </li>
);

export default function Page() {
  const params = useParams();
  const db = useDatabase();
  const orderRef = useMemo(
    () => doc(collection(db, 'orders').withConverter(firestoreOrderConverter), params.id as string),
    [db, params.id]
  );

  const orderQuery = useFirestoreDocumentQuery(orderRef, { enabled: !!params.id });

  const totalDiscountTaxIncluded = useMemo(() => {
    if (!orderQuery.data) return 0;
    const shippingDiscount =
      orderQuery.data.shipping.price.originalTaxIncluded - orderQuery.data.shipping.price.taxIncluded;
    const itemsDiscount = orderQuery.data.items.reduce(
      (acc, item) => (acc += item.originalTotalTaxIncluded - item.totalTaxIncluded),
      0
    );
    return shippingDiscount + itemsDiscount;
  }, [orderQuery.data?.items]);

  const validatePaymentMutation = useMutation({
    mutationFn: async () => {
      await setDoc(
        orderRef,
        {
          status: 'paid',
          paymentMethod: 'bank-transfert',
          paidAt: new Date(),
          workflowStep: 'in-production',
        } satisfies Difference<PaidOrder<'bank-transfert'>, WaitingBankTransferOrder>,
        {
          merge: true,
        }
      );
    },
  });

  const manuallySetTrackingNumberMutation = useMutation({
    mutationFn: async ({ trackingNumber }: { trackingNumber: string }) => {
      await setDoc(
        orderRef,
        {
          shipping: {
            trackingNumber,
          },
        },
        {
          merge: true,
        }
      );
    },
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: async () => {
      await setDoc(
        orderRef,
        {
          workflowStep: 'delivered',
        },
        {
          merge: true,
        }
      );
    },
  });

  if (orderQuery.isError) throw orderQuery.error;
  if (orderQuery.isPending) return <div>Loading...</div>;
  if (!orderQuery.data) return <div>Order not found</div>;

  return (
    <div className="relative max-w-7xl mx-auto py-10 px-4 rounded-sm border shadow-md">
      <h1 className="text-3xl text-center font-serif">Commande n°{orderQuery.data.reference}</h1>
      <div className="absolute top-0 right-0">
        <ArchiveButton orderRef={orderRef} />
      </div>
      <ol className="flex flex-wrap pb-4 gap-2 justify-center my-6">
        <WorkflowStepComponent active={orderQuery.data.status !== 'paid'} label="Attente de paiement" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'in-production'} label="En cours" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'in-delivery'} label="Expédié" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'delivered'} label="Livré" />
      </ol>
      {orderQuery.data.status === 'waitingBankTransfer' && (
        <div className="flex gap-4 mb-4">
          <div className="w-full hidden md:block"></div>
          <div className="w-full border rounded-sm pt-4">
            <h2 className="text-center">Cette commande est en attente de paiement.</h2>
            <ValidatePaymentModal
              name={orderQuery.data.billing.lastName}
              total={orderQuery.data.totalTaxIncluded}
              onSubmit={validatePaymentMutation.mutateAsync}
            />
          </div>
        </div>
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
          {orderQuery.data.invoice && (
            <Link href={orderQuery.data.invoice.url} className="btn-secondary" target="_blank">
              Télécharger la facture
            </Link>
          )}
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de livraison</h2>
          {orderQuery.data.shipping.method === 'pickup-at-workshop' ? (
            'Retrait en atelier'
          ) : (
            <>
              <p>Transporteur: {orderQuery.data.shipping.method} </p>
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
            </>
          )}
          {orderQuery.data.manufacturingTimes && (
            <p>
              Délais de confection annoncés au moment de la commande:
              <br />
              {orderQuery.data.manufacturingTimes.min}-{orderQuery.data.manufacturingTimes.max}{' '}
              {translateManufacturingTimesUnit(orderQuery.data.manufacturingTimes.unit)}
            </p>
          )}
          {orderQuery.data.shipping.trackingNumber && <p>numéro de suivi: {orderQuery.data.shipping.trackingNumber}</p>}
          {!orderQuery.data.shipping.trackingNumber &&
            orderQuery.data.workflowStep === 'in-production' &&
            orderQuery.data.shipping.method !== 'pickup-at-workshop' && (
              <SendTrackingNumberModal onSubmit={manuallySetTrackingNumberMutation.mutateAsync} />
            )}
          {(orderQuery.data.workflowStep === 'in-production' &&
            orderQuery.data.shipping.method === 'pickup-at-workshop') ||
            (orderQuery.data.workflowStep !== 'delivered' && orderQuery.data.shipping.trackingNumber && (
              <MarkAsDeliveredModal
                name={orderQuery.data.billing.lastName}
                onSubmit={markAsDeliveredMutation.mutateAsync}
              />
            ))}
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Paiement</h2>
          <p>Frais de port: {padNumber(orderQuery.data.shipping.price.taxIncluded)} €</p>
          {!!orderQuery.data.extras.reduceManufacturingTimes && (
            <p>Sup. urgent: {padNumber(orderQuery.data.extras.reduceManufacturingTimes.price.priceTaxIncluded)} €</p>
          )}
          {!!orderQuery.data.promotionCode && (
            <>
              <p className="font-bold flex !mt-4">
                Sous total: {padNumber(orderQuery.data.totalTaxIncluded + totalDiscountTaxIncluded)} €
              </p>
              <p>
                Code promotionnel
                <br /> {orderQuery.data.promotionCode.code}: - {padNumber(totalDiscountTaxIncluded)} €
              </p>
            </>
          )}
          <p className="font-bold !mt-4">Total: {padNumber(orderQuery.data.totalTaxIncluded)} €</p>
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
        <li key={type} className="flex flex-col empty:hidden">
          {type === 'fabric' && <h3 className="font-bold">Tissus</h3>}
          {Object.entries(choices)
            .filter(([_, choice]) => choice.value !== '')
            .map(([customizationId, choice]) => (
              <p key={customizationId}>
                {choice.title}: {choice.value}
              </p>
            ))}
        </li>
      ))}
    </ul>
  );
}

const trackingNumberFormSchema = z.object({
  trackingNumber: z.string().min(1),
});
function SendTrackingNumberModal(props: { onSubmit: (payload: { trackingNumber: string }) => void }) {
  const form = useForm<z.infer<typeof trackingNumberFormSchema>>({ resolver: zodResolver(trackingNumberFormSchema) });
  const onSubmit = form.handleSubmit((data) => props.onSubmit(data));

  return (
    <Popover className="relative" as="div">
      <Popover.Button className="btn-light">Envoyer un numéro de suivi déjà payé</Popover.Button>
      <Transition>
        <Transition.Child
          as={Popover.Overlay}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          className="fixed inset-0 bg-black bg-opacity-10"
        ></Transition.Child>
        <Transition.Child
          enter="transition-transform duration-300"
          enterFrom="transform scale-95"
          enterTo="transform scale-100"
          as={Popover.Panel}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-sm shadow-md"
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-4 bg-white">
            <Field
              label="Numéro de suivi"
              widgetId="trackingNumber"
              labelClassName="!items-start"
              error={form.formState.errors.trackingNumber?.message}
              renderWidget={(className) => (
                <input id="trackingNumber" type="text" {...form.register('trackingNumber')} className={className} />
              )}
            />
            <button type="submit" className="btn-primary">
              Envoyer
            </button>
          </form>
        </Transition.Child>
      </Transition>
    </Popover>
  );
}

function ValidatePaymentModal(props: { name: string; total: number; onSubmit: () => void }) {
  return (
    <Popover>
      <Popover.Button className="btn-light mx-auto">Valider le paiement</Popover.Button>
      <Transition>
        <Transition.Child
          as={Popover.Overlay}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          className="fixed inset-0 bg-black bg-opacity-10"
        ></Transition.Child>
        <Transition.Child
          enter="transition-transform duration-300"
          enterFrom="transform scale-95"
          enterTo="transform scale-100"
          as={Popover.Panel}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-sm shadow-md"
        >
          <div className="flex flex-col gap-4 bg-white">
            <p>Es-tu sûr de vouloir valider le paiement de cette commande?</p>
            <p>(Un email de confirmation va être envoyé au client)</p>
            <strong className="mx-auto">
              "{props.name} - {padNumber(props.total)} €"
            </strong>
            <button type="submit" className="btn-primary" onClick={props.onSubmit}>
              Valider
            </button>
          </div>
        </Transition.Child>
      </Transition>
    </Popover>
  );
}

function MarkAsDeliveredModal(props: { name: string; onSubmit: () => void }) {
  return (
    <Popover>
      <Popover.Button className="btn-light mx-auto">Marquer comme livré</Popover.Button>
      <Transition>
        <Transition.Child
          as={Popover.Overlay}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          className="fixed inset-0 bg-black bg-opacity-10"
        ></Transition.Child>
        <Transition.Child
          enter="transition-transform duration-300"
          enterFrom="transform scale-95"
          enterTo="transform scale-100"
          as={Popover.Panel}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-sm shadow-md"
        >
          <div className="flex flex-col gap-4 bg-white">
            <p>Es-tu sûr de marquer la commande comme livrée ?</p>
            <p>(Aucun email n'est envoyé)</p>
            <strong className="mx-auto">"{props.name}"</strong>
            <button type="submit" className="btn-primary" onClick={props.onSubmit}>
              Valider
            </button>
          </div>
        </Transition.Child>
      </Transition>
    </Popover>
  );
}

function padNumber(n: number) {
  return n.toFixed(2);
}

function translateManufacturingTimesUnit(unit: string) {
  switch (unit) {
    case 'days':
      return 'jours';
    case 'weeks':
      return 'semaines';
    case 'months':
      return 'mois';
    default:
      return unit;
  }
}
