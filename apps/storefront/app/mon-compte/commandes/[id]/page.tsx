'use client';

import { useQuery } from '@tanstack/react-query';
import useDatabase from '../../../../hooks/useDatabase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import clsx from 'clsx';
import { loader } from '../../../../utils/next-image-firebase-storage-loader';
import Link from 'next/link';
import { StorageImage } from '../../../StorageImage';
import { trpc } from 'apps/storefront/trpc-client';

const WorkflowStepComponent = ({ active, label }: { active: boolean; label: string }) => (
  <li
    className={clsx(
      'after:content-[">"] after:text-black after:font-normal after:inline-block after:ml-2 last:after:content-none',
      active && 'text-primary-100 font-semibold'
    )}
    aria-hidden={!active}
    aria-label={'Etape de la commande:' + label}
  >
    {label}
  </li>
);

export default function Page() {
  const params = useParams();
  const db = useDatabase();
  const orderQuery = trpc.orders.findById.useQuery(params.id as string);

  if (orderQuery.isError) throw orderQuery.error;
  if (orderQuery.isPending) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 rounded-sm border shadow-md">
      <h1 className="text-3xl text-center font-serif mb-2">Commande n°{orderQuery.data.reference}</h1>
      <ol className="flex flex-wrap pb-4 gap-2 justify-center my-6">
        <WorkflowStepComponent active={orderQuery.data.status !== 'PAID'} label="Attente de paiement" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'PRODUCTION'} label="En cours" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'SHIPPING'} label="Expédié" />
        <WorkflowStepComponent active={orderQuery.data.workflowStep === 'DELIVERED'} label="Livré" />
      </ol>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold" data-posthog-recording-masked>
            Informations de facturation
          </h2>
          <div>
            <p>
              Nom: {orderQuery.data.billing.firstName} {orderQuery.data.billing.lastName}
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

          {orderQuery.data.invoice && (
            <Link href={orderQuery.data.invoice.url} className="btn-secondary" target="_blank">
              Télécharger la facture
            </Link>
          )}
        </div>
        <div className="border rounded-sm w-full p-4 space-y-2">
          <h2 className="text-xl font-bold">Informations de livraison</h2>
          {orderQuery.data.shipping.deliveryMode === 'pickup-at-workshop' ? (
            <p>Retrait à l'atelier. Justine te contactera lorsque ta commande sera prête</p>
          ) : orderQuery.data.shipping.deliveryMode === 'do-not-ship' ? (
            <p>Ta commande ne contient pas d'articles physiques à livrer.</p>
          ) : (
            <div data-posthog-recording-masked>
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
          )}

          {orderQuery.data.manufacturingTimes && (
            <p>
              Délais de confection annoncés au moment de la commande:
              <br />
              {orderQuery.data.manufacturingTimes.min}-{orderQuery.data.manufacturingTimes.max}{' '}
              {translateManufacturingTimesUnit(orderQuery.data.manufacturingTimes.unit)}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 border rounded-sm p-4">
        <h2 className="text-xl font-bold text-center mb-4">Articles</h2>
        <ul
          className={clsx(
            'grid place-content-center',
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
                blurDataURL={item.image.placeholderDataUrl ?? undefined}
                alt=""
                className="w-64 h-64 object-contain object-center"
                loader={loader}
              />
              <div className="flex flex-col">
                <p data-posthog-recording-masked>{item.description}</p>
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
                <p>Cadeau offert</p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
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
