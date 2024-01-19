'use client';

import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import clsx from 'clsx';
import { useMemo } from 'react';
import { CartItemLine } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { loader } from '../../utils/next-image-firebase-storage-loader';
import { useAuth } from '../../contexts/AuthContext';
import ManufacturingTimes from '../manufacturingTimes';

export default function Page() {
  const { getCartQuery } = useCart();
  const { userQuery } = useAuth();

  if (getCartQuery.isError) throw getCartQuery.error;

  const containsCustomizedItems = useMemo(
    () => getCartQuery.data?.items.some((item) => item.type === 'customized'),
    [getCartQuery.data?.items]
  );

  const containsInStockItems = useMemo(
    () => getCartQuery.data?.items.some((item) => item.type === 'inStock'),
    [getCartQuery.data?.items]
  );

  if (getCartQuery.isFetching) return <div>Chargement...</div>;

  const itemsQuantity = getCartQuery.data?.items.length ?? 0;
  const cartDesc =
    itemsQuantity === 0 ? 'Votre panier est vide.' : itemsQuantity === 1 ? '1 article' : `${itemsQuantity} articles`;

  return (
    <div
      className={clsx(
        'max-w-3xl mx-auto py-8 md:border rounded-md md:shadow-sm my-20',
        (getCartQuery.data?.items.length ?? 0) > 0 && 'mt-8'
      )}
    >
      <h1 className="text-4xl font-serif text-center mb-2 px-4">Panier</h1>
      <p className="text-center px-4">{cartDesc}</p>
      <div className="flex flex-col items-center border-t border-b mt-4 p-4 empty:hidden">
        {getCartQuery.data?.items.map((item, i) => (
          <CartItemLine key={i} item={item} imageLoader={loader} />
        ))}
      </div>
      {containsInStockItems && containsCustomizedItems && (
        <p className="text-center my-2">
          L'expedition en 48h n'est pas disponible lorsque vous avez des articles personnalisés.
        </p>
      )}
      {containsCustomizedItems && <ManufacturingTimes className="text-center mb-4" />}

      {!!getCartQuery.data?.items.length && (
        <>
          <p className="text-xl text-center p-4">
            <span className="">Total: </span>
            <span className="font-bold">{getCartQuery.data?.totalTaxIncluded.toFixed(2)}€</span>
          </p>
          {userQuery.data?.isAnonymous ? (
            <>
              <p className="text-center font-bold mt-8">Vous devez être connecté pour passer commande.</p>
              <Link href={routes().auth().login(routes().cart().index())} className="btn-primary mx-auto mt-4">
                Se connecter
              </Link>
            </>
          ) : (
            <Link href={routes().cart().finalize()} className="btn-primary mx-auto mt-4">
              Passer commande
            </Link>
          )}
        </>
      )}
      {!getCartQuery.data?.items.length && (
        <Link href={routes().shop().index()} className="btn-primary mx-auto mt-4">
          Voir toutes les créations
        </Link>
      )}
    </div>
  );
}
