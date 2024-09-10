'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import { OrderItemCustomized } from '@couture-next/types';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CloseButton, Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Field } from '@couture-next/ui/form/Field';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { ArchiveButton } from './ArchiveButton';
import { StorageImage } from '../../../StorageImage';
import Link from 'next/link';
import { AdminCommentForm } from './AdminCommentForm';
import { trpc } from 'apps/storefront/trpc-client';
import { routes } from '@couture-next/routing';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import BuyShippingLabel from './BuyShippingLabel';

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
  const orderQuery = trpc.orders.findById.useQuery(params.id as string);

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

  const trpcUtils = trpc.useUtils();

  const generateInvoiceMutation = trpc.orders.generateInvoice.useMutation({
    onSuccess: () => {
      trpcUtils.orders.invalidate();
    },
  });
  const generateInvoiceFn = useCallback(() => generateInvoiceMutation.mutate(params.id as string), [params.id]);

  const validatePaymentMutation = trpc.payments.validateBankTransferPayment.useMutation({
    onSuccess: () => {
      trpcUtils.orders.invalidate();
    },
  });
  const validatePaymentFn = useCallback(
    () => validatePaymentMutation.mutateAsync(params.id as string),
    [params.id, validatePaymentMutation]
  );

  const manuallySetTrackingNumberMutation = trpc.orders.manuallySetTrackingNumber.useMutation({
    onSuccess: () => {
      trpcUtils.orders.invalidate();
    },
  });
  const manuallySetTrackingNumberFn = useCallback(
    (payload: { trackingNumber: string }) =>
      manuallySetTrackingNumberMutation.mutateAsync({
        orderId: params.id as string,
        trackingNumber: payload.trackingNumber,
      }),
    [params.id, manuallySetTrackingNumberMutation]
  );

  const markAsDeliveredMutation = trpc.orders.markOrderAsDelivered.useMutation({
    onSuccess: () => {
      trpcUtils.orders.invalidate();
    },
  });
  const markAsDeliveredFn = useCallback(
    () => markAsDeliveredMutation.mutateAsync(params.id as string),
    [params.id, markAsDeliveredMutation]
  );

  if (orderQuery.isError) throw orderQuery.error;
  if (orderQuery.isPending) return <div>Loading...</div>;
  if (!orderQuery.data) return <div>Order not found</div>;

  return (
    <div className="relative max-w-7xl mx-auto py-10 px-4 rounded-sm border shadow-md">
      <h1 className="text-3xl text-center font-serif">Commande n°{orderQuery.data.reference}</h1>
      <p className="bg-red-500 text-white font-bold text-center py-2 mt-4">Commande urgente</p>
      <div className="absolute top-0 right-0">
        <ArchiveButton orderId={params.id as string} />
      </div>
      <ol className="flex flex-wrap pb-4 gap-2 justify-center my-6">
        <WorkflowStepComponent active={orderQuery.data.status !== 'PAID'} label="Attente de paiement" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'PRODUCTION'} label="En cours" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'SHIPPING'} label="Expédié" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'DELIVERED'} label="Livré" />
      </ol>
      {orderQuery.data.status === 'WAITING_BANK_TRANSFER' && (
        <div className="flex gap-4 mb-4">
          <div className="w-full hidden md:block"></div>
          <div className="w-full border rounded-sm pt-4">
            <h2 className="text-center">Cette commande est en attente de paiement.</h2>
            <p className="text-center">
              Depuis le {orderQuery.data.createdAt.toLocaleDateString()} (
              {Math.floor(
                (Date.now() - new Date(orderQuery.data.createdAt).setHours(0, 0, 0, 0)) / 1000 / 60 / 60 / 24
              )}{' '}
              jours)
            </p>
            <ValidatePaymentModal
              name={orderQuery.data.billing.lastName}
              total={orderQuery.data.totalTaxIncluded}
              onSubmit={validatePaymentFn}
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
            <p className="flex items-center gap-2">
              Email:
              <Link
                href={routes().admin().users().user(orderQuery.data.user.id).show()}
                className="flex items-center gap-2 underline"
              >
                {orderQuery.data.user.email}
                <ArrowTopRightOnSquareIcon className="w-6 h-6" />
              </Link>
            </p>
            {orderQuery.data.status === 'PAID' && (
              <p>
                Payée le {orderQuery.data.paidAt!.toLocaleDateString()} par{' '}
                {orderQuery.data.billing.paymentMethod === 'CARD'
                  ? 'carte'
                  : orderQuery.data.billing.paymentMethod === 'BANK_TRANSFER'
                  ? 'virement bancaire'
                  : 'carte cadeau'}
              </p>
            )}
            {!!orderQuery.data.billing.amountPaidWithGiftCards &&
              orderQuery.data.billing.paymentMethod !== 'GIFT_CARD' && (
                <p>Dont {orderQuery.data.billing.amountPaidWithGiftCards.toFixed(2)}€ payés avec une carte cadeau</p>
              )}
            {orderQuery.data.status === 'WAITING_BANK_TRANSFER' && (
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
          {orderQuery.data.invoice ? (
            <Link href={orderQuery.data.invoice.url} className="btn-light" target="_blank">
              Télécharger la facture
            </Link>
          ) : (
            orderQuery.data.paidAt && (
              <ButtonWithLoading
                loading={generateInvoiceMutation.isPending}
                className="btn-primary"
                onClick={generateInvoiceFn}
              >
                Générer la facture
              </ButtonWithLoading>
            )
          )}
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de livraison</h2>
          {orderQuery.data.shipping.deliveryMode === 'pickup-at-workshop' ? (
            <>
              <p>Retrait en atelier</p>
              <p>Numéro de téléphone: {orderQuery.data.shipping.phoneNumber}</p>
            </>
          ) : orderQuery.data.shipping.deliveryMode === 'do-not-ship' ? (
            "La commande ne contient pas d'articles physiques à livrer."
          ) : (
            <>
              <p>
                <img
                  src={
                    (
                      orderQuery.data.shipping as PrismaJson.OrderShipping & {
                        deliveryMode: 'deliver-at-home' | 'deliver-at-pickup-point';
                      }
                    ).carrierIconUrl
                  }
                  width={70}
                  height={40}
                  alt="Icon du transporteur"
                />
                Transporteur:{' '}
                {
                  (
                    orderQuery.data.shipping as PrismaJson.OrderShipping & {
                      deliveryMode: 'deliver-at-home' | 'deliver-at-pickup-point';
                    }
                  ).carrierLabel
                }{' '}
              </p>
              <p>
                Client: {orderQuery.data.shipping.firstName} {orderQuery.data.shipping.lastName}
              </p>
              <p>Numéro de téléphone: {orderQuery.data.shipping.phoneNumber}</p>
              <div className="flex flex-col">
                <p>Adresse du client:</p>
                <p>{orderQuery.data.shipping.address}</p>
                <p className="empty:hidden">{orderQuery.data.shipping.addressComplement}</p>
                <div>
                  {orderQuery.data.shipping.zipCode} {orderQuery.data.shipping.city}
                </div>
                <p>{orderQuery.data.shipping.country}</p>
              </div>
              <p>Poids: {orderQuery.data.totalWeight}g</p>
              {orderQuery.data.shipping.deliveryMode === 'deliver-at-pickup-point' && (
                <div>
                  <p>Point relais: {orderQuery.data.shipping.pickupPoint.name}</p>
                  <p>Adresse du point relais:</p>
                  <p>{orderQuery.data.shipping.pickupPoint.address}</p>
                  <p>{orderQuery.data.shipping.pickupPoint.zipCode}</p>
                  <p>{orderQuery.data.shipping.pickupPoint.city}</p>
                  <p>{orderQuery.data.shipping.pickupPoint.country}</p>
                </div>
              )}
            </>
          )}
          {orderQuery.data.manufacturingTimes && (
            <p>
              Délais de confection annoncés au moment de la commande:
              <br />
              {orderQuery.data.manufacturingTimes.min !== orderQuery.data.manufacturingTimes.max
                ? `${orderQuery.data.manufacturingTimes.min} à ${orderQuery.data.manufacturingTimes.max}`
                : orderQuery.data.manufacturingTimes.min}{' '}
              {translateManufacturingTimesUnit(orderQuery.data.manufacturingTimes.unit)}
            </p>
          )}
          {orderQuery.data.shipping.trackingNumber && <p>numéro de suivi: {orderQuery.data.shipping.trackingNumber}</p>}
          {!orderQuery.data.shipping.trackingNumber &&
            orderQuery.data.workflowStep === 'PRODUCTION' &&
            orderQuery.data.shipping.deliveryMode !== 'pickup-at-workshop' && (
              <>
                <SendTrackingNumberModal onSubmit={manuallySetTrackingNumberFn} />
                <BuyShippingLabel orderId={params.id as string} />
              </>
            )}
          {orderQuery.data.workflowStep === 'PRODUCTION' &&
            orderQuery.data.shipping.deliveryMode === 'pickup-at-workshop' && (
              <MarkAsDeliveredModal name={orderQuery.data.billing.lastName} onSubmit={markAsDeliveredFn} />
            )}
          {orderQuery.data.workflowStep === 'SHIPPING' &&
            orderQuery.data.shipping.deliveryMode !== 'pickup-at-workshop' &&
            orderQuery.data.shipping.deliveryMode !== 'do-not-ship' &&
            !orderQuery.data.shipping.shippingLabel && (
              <p className="text-yellow-500">
                Boxtal ne nous a pas encore envoyé de bordereau, essaies de rafraichir dans quelques secondes.
              </p>
            )}
          {orderQuery.data.workflowStep === 'SHIPPING' &&
            orderQuery.data.shipping.deliveryMode !== 'pickup-at-workshop' &&
            orderQuery.data.shipping.deliveryMode !== 'do-not-ship' &&
            orderQuery.data.shipping.shippingLabel && (
              <Link href={orderQuery.data.shipping.shippingLabel.url} target="_blank" className="btn-light mx-auto">
                Télécharger le bordereau
              </Link>
            )}
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Paiement</h2>
          <p>Frais de port: {padNumber(orderQuery.data.shipping.price.taxIncluded)} €</p>
          {!!orderQuery.data.extras.reduceManufacturingTimes && (
            <p>Sup. urgent: {padNumber(orderQuery.data.extras.reduceManufacturingTimes.priceTaxIncluded)} €</p>
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
      <div className="mt-6 max-w-sm mx-auto">
        <div className="border pt-4">
          <h2 className="text-xl font-bold text-center">Commentaire administrateur</h2>
          <AdminCommentForm orderId={params.id as string} className="w-full p-4" />
        </div>
      </div>
      <div className="mt-6 border rounded-sm p-4">
        <h2 className="text-xl font-bold text-center">Articles</h2>
        <ul
          className={clsx(
            'grid place-content-center mt-8 gap-4',
            orderQuery.data.items.length > 1 && 'sm:grid-cols-[repeat(auto-fill,minmax(30rem,1fr))]'
          )}
        >
          {orderQuery.data.items.map((item, i) => (
            <li key={i} className="flex flex-col md:flex-row items-center gap-4">
              <Image
                width={256}
                height={256}
                src={item.image.url}
                placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={item.image.placeholderDataUrl ?? undefined}
                loader={loader}
                alt=""
                className="w-64 h-64 object-contain object-center"
              />
              <div className="">
                <p className="text-xl font-bold">{item.description}</p>
                <p className="underline text-sm empty:hidden">
                  {item.type === 'customized' ? 'Sur mesure' : item.type === 'inStock' ? 'En stock' : ''}
                </p>
                {item.quantity > 1 && <p className="font-bold">Quantité: {item.quantity}</p>}
                {item.type !== 'giftCard' && item.type !== 'workshopSession' && (
                  <ItemCustomizations customizations={item.customizations} />
                )}
                {!!item.customerComment && <p className="max-w-sm">Commentaire client: {item.customerComment}</p>}
              </div>
            </li>
          ))}
          {orderQuery.data.giftOffered && (
            <li className="flex items-center gap-4">
              <StorageImage
                width={256}
                height={256}
                src="public/images/gift.webp"
                alt="Image d'un paquet cadeau"
                className="w-64 h-64 object-contain object-center"
              />
              <div className="flex flex-col">
                <p className="text-xl font-bold">Cadeau offert</p>
              </div>
            </li>
          )}
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
      <PopoverButton className="btn-light">Envoyer un numéro de suivi déjà payé</PopoverButton>
      <Transition
        enter="transition-transform duration-300"
        enterFrom="transform scale-95"
        enterTo="transform scale-100"
      >
        <PopoverPanel className="border bg-white p-4 rounded-sm shadow-md relative">
          <CloseButton className="absolute right-2 top-2">
            <XMarkIcon className="w-6 h-6" />
          </CloseButton>
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
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}

function ValidatePaymentModal(props: { name: string; total: number; onSubmit: () => void }) {
  return (
    <Popover>
      <PopoverButton className="btn-light mx-auto">Valider le paiement</PopoverButton>
      <Transition
        enter="transition-transform duration-300"
        enterFrom="transform scale-95"
        enterTo="transform scale-100"
      >
        <PopoverPanel className="border relative bg-white p-4 rounded-sm shadow-md">
          <CloseButton className="absolute right-2 top-2">
            <XMarkIcon className="w-6 h-6" />
          </CloseButton>
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
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}

function MarkAsDeliveredModal(props: { name: string; onSubmit: () => void }) {
  return (
    <Popover>
      <PopoverButton className="btn-light mx-auto">Marquer comme livré</PopoverButton>
      <Transition
        enter="transition-transform duration-300"
        enterFrom="transform scale-95"
        enterTo="transform scale-100"
      >
        <PopoverPanel className="border relative bg-white p-4 rounded-sm shadow-md">
          <CloseButton className="absolute right-2 top-2">
            <XMarkIcon className="w-6 h-6" />
          </CloseButton>
          <div className="flex flex-col gap-4 bg-white">
            <p>Es-tu sûr de marquer la commande comme livrée ?</p>
            <p>(Aucun email n'est envoyé)</p>
            <strong className="mx-auto">"{props.name}"</strong>
            <button type="submit" className="btn-primary" onClick={props.onSubmit}>
              Valider
            </button>
          </div>
        </PopoverPanel>
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
    case 'DAYS':
      return 'jours';
    case 'weeks':
    case 'WEEKS':
      return 'semaines';
    case 'months':
    case 'MONTHS':
      return 'mois';
    default:
      return unit;
  }
}
