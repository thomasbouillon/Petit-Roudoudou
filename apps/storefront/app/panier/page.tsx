'use client';

import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import clsx from 'clsx';

export default function Page() {
  const { getCartQuery } = useCart();
  if (getCartQuery.isError) throw getCartQuery.error;
  if (getCartQuery.isLoading) return <div>Chargement...</div>;

  const itemsQuantity = getCartQuery.data?.items.length ?? 0;

  return (
    <div
      className={clsx(
        'max-w-3xl mx-auto py-8 md:border rounded-md md:shadow-sm my-20',
        (getCartQuery.data?.items.length ?? 0) > 0 && 'mt-8'
      )}
    >
      <h1 className="text-4xl font-serif text-center mb-2  px-4">Panier</h1>
      <p className="text-center  px-4">
        {itemsQuantity === 0
          ? 'Votre panier est vide.'
          : itemsQuantity === 1
          ? '1 article'
          : `${itemsQuantity} articles`}
      </p>
      <div className="flex flex-col items-center border-t border-b my-4 p-4 empty:hidden">
        {getCartQuery.data?.items.map((item) => (
          <div
            key={item.skuId}
            className="flex sm:flex-row flex-col gap-4 space-y-4"
          >
            <div className="w-full">
              <Image
                src={item.image}
                alt=""
                width={256}
                height={256}
                className="w-64 h-64 object-contain object-center"
              />
            </div>
            <div className="flex flex-col justify-center w-full items-center sm:items-end">
              <h2>{item.description}</h2>
              <p className="font-bold">
                <span className="sr-only">Prix:</span>
                {item.totalTaxIncluded.toFixed(2)}€
              </p>
            </div>
          </div>
        ))}
      </div>
      {!!getCartQuery.data?.items.length && (
        <>
          <p className="text-2xl text-center  px-4">
            <span className="">Total: </span>
            <span className="font-bold">
              {getCartQuery.data?.totalTaxIncluded.toFixed(2)}€
            </span>
          </p>
          <Link
            href="/panier/paiement"
            className="btn-primary mx-auto rounded-full mt-4"
          >
            Paiement
          </Link>
        </>
      )}
      {!getCartQuery.data?.items.length && (
        <Link href="/boutique" className="btn-primary mx-auto mt-4">
          Voir toutes les créations
        </Link>
      )}
    </div>
  );
}
