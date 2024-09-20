import { routes } from '@couture-next/routing';
import Image from 'next/image';
import Link from 'next/link';
import { Order } from '@prisma/client';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export type OrdersProps<T extends 'default' | 'select' | 'show-shipped-at'> = {
  orders: Order[];
  title: string;
  useDisclosure?: boolean;
} & (T extends 'select'
  ? {
      variant: 'select';
      selection: string[];
      toggleSelection: (id: string) => void;
    }
  : T extends 'show-shipped-at'
  ? {
      variant?: 'show-shipped-at';
      selection?: never;
      toggleSelection?: never;
    }
  : {
      variant?: 'default';
      selection?: never;
      toggleSelection?: never;
    });

export function Orders<TVariant extends 'default' | 'select' | 'show-shipped-at'>(props: OrdersProps<TVariant>) {
  if (props.orders.length === 0) return null;
  return (
    <div className="max-w-3xl mx-auto my-8 py-4 relative">
      {props.useDisclosure ? (
        <Disclosure>
          <DisclosureButton className="w-full relative group">
            <h2 className="text-xl text-center mx-12 py-4">
              <span className="font-bold">{props.title}</span> ({props.orders.length})
            </h2>
            <ChevronDownIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 group-data-[open]:rotate-180" />
          </DisclosureButton>
          <DisclosurePanel>
            <OrdersList {...props} />
          </DisclosurePanel>
        </Disclosure>
      ) : (
        <>
          <h2 className="text-xl text-center font-bold px-4">{props.title}</h2>
          <OrdersList {...props} />
        </>
      )}
    </div>
  );
}

function OrdersList({
  orders,
  variant,
  selection,
  toggleSelection,
}: OrdersProps<'default' | 'select' | 'show-shipped-at'>) {
  return (
    <ul className="mt-4">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between flex-wrap px-4 py-2 first:border-t border-b">
          <div className="space-x-4">
            {variant === 'select' && (
              <input
                type="checkbox"
                checked={selection.includes(order.id)}
                onChange={() => toggleSelection(order.id)}
              />
            )}
            <Link href={routes().admin().orders().order(order.id).show()} className="underline">
              #{order.reference} - {order.billing.firstName} {order.billing.lastName}
              {order.status === 'PAID' && variant !== 'show-shipped-at' && (
                <> le {order.createdAt.toLocaleDateString()}</>
              )}
            </Link>
            {variant === 'show-shipped-at' && <OrderShippedAt order={order} />}
          </div>
          <div className="flex items-center flex-wrap">
            {order.items.map((item, i) => (
              <Image
                src={item.image.url}
                placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                blurDataURL={item.image.placeholderDataUrl ?? undefined}
                key={item.image.url}
                className="w-16 h-16 object-contain object-center"
                loader={loader}
                width={64}
                height={64}
                alt=""
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function OrderShippedAt({ order }: { order: Order }) {
  if (
    order.status !== 'PAID' ||
    order.workflowStep === 'PRODUCTION' ||
    order.shipping.deliveryMode === 'do-not-ship' ||
    order.shipping.deliveryMode === 'pickup-at-workshop'
  )
    return null;

  const shippedEvent = order.shipping.history?.find((event) => event.status === 'LIV');
  if (!shippedEvent) return <div className="inline-block">Bordereau acheté</div>;
  return (
    <div className="inline-block">
      Envoyé le{' '}
      {new Date(shippedEvent.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'CET',
      })}
    </div>
  );
}
