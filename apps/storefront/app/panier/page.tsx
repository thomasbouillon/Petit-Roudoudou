'use client';

import { useCart } from '../../contexts/CartContext';
import Link from 'next/link';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { CartItemLine } from '@couture-next/ui/cart/CartItemLine';
import { routes } from '@couture-next/routing';
import { loader } from '../../utils/next-image-firebase-storage-loader';
import { useAuth } from '../../contexts/AuthContext';
import ManufacturingTimes from '../manufacturingTimes';
import useSetting from 'apps/storefront/hooks/useSetting';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { cartContainsCustomizedItems } from '@couture-next/utils';
import { CartItemWithTotal } from '@couture-next/types';
import { QuantityWidget } from '@couture-next/ui/form/QuantityWidget';
import { trpc } from 'apps/storefront/trpc-client';
import toast from 'react-hot-toast';
import { Spinner } from '@couture-next/ui/Spinner';

export default function Page() {
  const { getCartQuery } = useCart();
  const { userQuery } = useAuth();

  if (getCartQuery.isError) throw getCartQuery.error;

  const containsInStockItems = useMemo(
    () => getCartQuery.data?.items.some((item) => item.type === 'inStock'),
    [getCartQuery.data?.items]
  );

  const containsCustomizedItems = useMemo(
    () => (getCartQuery.data ? cartContainsCustomizedItems(getCartQuery.data) : undefined),
    [getCartQuery.data?.items]
  );

  const { getSettingValueQuery } = useSetting('allowNewOrdersWithCustomArticles');
  if (getSettingValueQuery.isError) throw getSettingValueQuery.error;

  if ((getCartQuery.isFetching && !getCartQuery.isRefetching) || getSettingValueQuery.data === undefined)
    return <div>Chargement...</div>;

  const itemsQuantity = getCartQuery.data?.items.length ?? 0;
  const cartDesc =
    itemsQuantity === 0 ? 'Ton panier est vide.' : itemsQuantity === 1 ? '1 article' : `${itemsQuantity} articles`;

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
          <CartItemLine
            key={item.uid}
            item={item}
            imageLoader={loader}
            renderQuantityWidget={(item: CartItemWithTotal) => <ChangeCartItemQuantityWidget cartItem={item} />}
          />
        ))}
      </div>
      {containsInStockItems && containsCustomizedItems && (
        <p className="text-center my-2 max-w-md mx-auto">
          L&apos;expedition en 48h n&apos;est pas disponible lorsque tu as des créations personnalisées. Fais 2
          commandes si tu souhaites recevoir tes créations éligibles en 48h.
        </p>
      )}
      {containsInStockItems && !containsCustomizedItems && (
        <p className="text-center my-2">Expédition des articles sous 48h.</p>
      )}
      {containsCustomizedItems && <ManufacturingTimes className="text-center mb-4" />}

      {!!getCartQuery.data?.items.length && (
        <>
          <p className="text-xl text-center p-4">
            <span className="">Total: </span>
            <span className="font-bold">{getCartQuery.data?.totalTaxIncluded.toFixed(2)}€</span>
          </p>
          {!userQuery.data || userQuery.data.role === 'ANONYMOUS' ? (
            <>
              <p className="text-center font-bold mt-8">Tu dois être connecté pour passer commande.</p>
              <Link href={routes().auth().login(routes().cart().index())} className="btn-primary mx-auto mt-4">
                Se connecter
              </Link>
            </>
          ) : getSettingValueQuery.data || !containsCustomizedItems ? (
            <Link href={routes().cart().finalize()} className="btn-primary mx-auto mt-4">
              Passer commande
            </Link>
          ) : (
            <>
              <p className="max-w-md text-pretty mx-auto px-8 relative text-center">
                Les nouvelles commandes sont temporairement désactivées, seuls les articles <strong>en stock</strong> de
                la{' '}
                <Link href={routes().shop().index()} className="text-primary-100 font-bold underline">
                  boutique
                </Link>{' '}
                sont disponibles à la commande.
                <ExclamationTriangleIcon className="w-6 h-6 absolute top-1/2 -translate-y-1/2 left-0 text-primary-100" />
                <ExclamationTriangleIcon className="w-6 h-6 absolute top-1/2 -translate-y-1/2 right-0 text-primary-100" />
              </p>
              <Link href="#" className="btn-primary mx-auto mt-4 opacity-70">
                <span aria-hidden>Passer commande</span>
                <span className="sr-only">Lien indisponible pour le moment.</span>
              </Link>
            </>
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

const ChangeCartItemQuantityWidget = ({ cartItem }: { cartItem: CartItemWithTotal }) => {
  const hasMinQuantity = cartItem.type === 'customized';
  const hasMaxQuantity = cartItem.type === 'inStock';

  const articleQuery = trpc.articles.findById.useQuery(cartItem.articleId!, {
    enabled: hasMinQuantity || hasMaxQuantity,
  });

  const { changeQuantityMutation } = useCart();
  const changeQuantity = useCallback(async (itemUid: string, quantity: number) => {
    // setQuantities((prev) => ({ ...prev, [itemIndex.toString()]: quantity }));
    await changeQuantityMutation
      .mutateAsync({
        itemUid,
        newQuantity: quantity,
      })
      .catch(console.warn);
  }, []);

  if (articleQuery.isError || articleQuery.isFetching) return null;

  const minQuantity = articleQuery.data?.minQuantity ?? 0;
  const maxQuantity = articleQuery.data?.stocks.find((sku) => sku.uid === cartItem.stockUid)?.stock ?? undefined;

  return (
    <div className="relative">
      <QuantityWidget
        style={{ border: true }}
        onChange={(quantity) => changeQuantity(cartItem.uid, quantity)}
        value={cartItem.quantity}
        min={minQuantity}
        max={maxQuantity}
      />
      {changeQuantityMutation.isPending && (
        <div className="absolute top-1/2 left-full translate-x-2 -translate-y-1/2">
          <Spinner />
        </div>
      )}
    </div>
  );
};
