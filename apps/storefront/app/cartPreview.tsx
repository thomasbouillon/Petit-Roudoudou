'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Transition } from '@headlessui/react';
import CartIcon from '../assets/cart.svg';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { routes } from '@couture-next/routing';
import { originalImageLoader, loader } from '../utils/next-image-firebase-storage-loader';
import { useBlockBodyScroll } from '../contexts/BlockBodyScrollContext';
import useIsMobile from '../hooks/useIsMobile';
import { useDebounce } from '../hooks/useDebounce';
import { QuantityWidget } from '@couture-next/ui';
import { usePathname } from 'next/navigation';
import { Offers, fetchFromCMS } from '../directus';
import { useQuery } from '@tanstack/react-query';

export function CartPreview() {
  const [expanded, _setExpanded] = useState(false);
  const pathname = usePathname();

  const setBodyScrollBlocked = useBlockBodyScroll();
  const isMobile = useIsMobile(true);

  const setExpanded = useCallback(
    (b: boolean) => {
      setBodyScrollBlocked(isMobile && b);
      _setExpanded(b);
    },
    [_setExpanded, setBodyScrollBlocked, isMobile]
  );

  useEffect(() => {
    setBodyScrollBlocked(expanded && isMobile);
  }, [isMobile]);

  // Close the cart when navigating
  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  // trick to use original image when item is added to the cart but yet not resized
  const [imagesInError, setImagesInError] = useState<Record<string, boolean>>({});

  const {
    getCartQuery: { data: cart, isPending, isError, error, isFetching },
    docRef: cartDocRef,
    changeQuantityMutation: updateCartItemQuantitiesMutation,
  } = useCart();
  if (isError) throw error;

  // Reset expanded state when cart changes (except on first load)
  const isFirstLoadForRef = useRef(true);
  useEffect(() => {
    isFirstLoadForRef.current = true;
  }, [cartDocRef]);
  useEffect(() => {
    if (isPending) return; // ignore triggers while first load is not finished
    if (isFirstLoadForRef.current) {
      isFirstLoadForRef.current = false;
      return;
    }
    setExpanded(cart !== null);
  }, [cart, isPending]);

  useEffect(() => {
    setImagesInError({});
  }, [cart]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const changeQuantity = useCallback(
    (itemIndex: number, quantity: number) => {
      setQuantities((prev) => ({ ...prev, [itemIndex.toString()]: quantity }));
    },
    [setQuantities]
  );

  const pendingUpdateQuantities = useRef<Record<string, number>>({});
  const debouncedQuantities = useDebounce(quantities, 500);
  useEffect(() => {
    if (Object.keys(debouncedQuantities).length === 0) return;
    const modifiedQuantities = { ...debouncedQuantities };
    if (updateCartItemQuantitiesMutation.isPending) {
      pendingUpdateQuantities.current = modifiedQuantities;
    } else {
      updateCartItemQuantitiesMutation.mutateAsync(modifiedQuantities).finally(() => {
        setQuantities({});
      });
    }
  }, [debouncedQuantities]);

  useEffect(() => {
    if (!updateCartItemQuantitiesMutation.isPending && Object.keys(pendingUpdateQuantities.current).length > 0) {
      setQuantities({});
      const next = pendingUpdateQuantities.current;
      pendingUpdateQuantities.current = {};
      updateCartItemQuantitiesMutation.mutate(next);
    }
  }, [updateCartItemQuantitiesMutation.isPending]);

  const debouncedCart = useDebounce(cart, 150);

  return (
    <>
      <button
        id="cart-preview-toggle-button"
        className="relative pr-2.5 text-primary-100"
        aria-controls="cart-preview"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(true);
        }}
      >
        <CartIcon className="w-8 h-8" />
        <span className="sr-only">{expanded ? 'Fermer le panier' : 'Ouvrir le panier'}</span>
        <span className="absolute top-0 right-0 -translate-y-1/2" aria-hidden>
          {isFetching ? '-' : cart?.items.length ?? 0}
        </span>
        <span className="sr-only">Le panier contient {cart?.items.length ?? 0} articles</span>
      </button>
      <div id="cart-preview">
        <Transition
          show={expanded}
          className="fixed top-0 right-0 z-[51] md:max-w-xs w-screen h-[100dvh] bg-light-100"
          enter="transition-transform"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition-transform"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="flex h-full flex-col px-4 py-8 md:shadow-[0_0_10px_0_rgba(0,0,0,0.2)] w-full">
            <h2 className="text-3xl font-serif text-center mb-8 px-6">Votre panier</h2>
            <button
              type="button"
              className="absolute top-8 right-2"
              onClick={() => setExpanded(false)}
              aria-controls="cart-preview"
              aria-expanded={expanded}
            >
              <span className="sr-only">Fermer le panier</span>
              <ArrowRightIcon className="w-8 h-8" aria-hidden />
            </button>
            <div className="flex flex-col justify-between items-center flex-grow relative overflow-y-scroll">
              <div className="space-y-4">
                {((debouncedCart ?? cart)?.items.length ?? 0) === 0 && (
                  <p className="text-center">Votre panier est vide</p>
                )}
                {(debouncedCart ?? cart)?.items.map((item, i) => (
                  <div key={item.skuId + i} className="flex justify-between gap-2">
                    <div className="flex items-center">
                      <Image
                        src={item.image.url}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-contain object-center"
                        loader={imagesInError[i] ? originalImageLoader : loader}
                        placeholder={item.image.placeholderDataUrl ? 'blur' : 'empty'}
                        blurDataURL={item.image.placeholderDataUrl}
                        alt=""
                        onError={() => {
                          if (!imagesInError[i]) {
                            setImagesInError((prev) => ({ ...prev, [i]: true }));
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-2 py-2">
                      <p>{item.description}</p>
                      <ul className="empty:hidden -mt-2">
                        {Object.values(item.customizations)
                          .filter((customized) => customized.type !== 'fabric' && customized.value !== '')
                          .map((customized, i) => (
                            <li key={i}>
                              {customized.title}:{' '}
                              {customized.type === 'boolean' ? (customized.value ? 'Oui' : 'Non') : customized.value}
                            </li>
                          ))}
                      </ul>
                      <QuantityWidget
                        value={
                          quantities[i.toString()] ??
                          (debouncedCart?.items.length === cart?.items.length
                            ? cart?.items?.[i]
                            : debouncedCart?.items?.[i]
                          )?.quantity
                        }
                        onChange={(v) => changeQuantity(i, v)}
                        disableMinus={item.quantity === 0}
                      />
                      <div className="flex flex-grow items-end font-bold">
                        {item.totalTaxIncluded < 0 ? (
                          <>
                            <p className="text-transparent placeholder w-8 h-6 overflow-hidden mr-1">
                              Chargement du prix...
                            </p>
                            €
                          </>
                        ) : (
                          <p>{item.totalTaxIncluded.toFixed(2)}€</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <OffersPreview cartTotal={(debouncedCart ?? cart)?.totalTaxIncluded} />
              </div>
            </div>
            <div className="bg-light-100 pt-4">
              {(cart?.items.length ?? 0) > 0 && (
                <p className="text-center">
                  Total:{' '}
                  {typeof cart?.totalTaxExcluded === 'number' && cart?.totalTaxIncluded < 0 ? (
                    <>
                      <span className="text-transparent placeholder w-8 h-6 mt-auto overflow-hidden mr-1 inline-block translate-y-1">
                        Chargement du prix...
                      </span>
                      €
                    </>
                  ) : (
                    <span className="font-bold">
                      <>{cart?.totalTaxIncluded.toFixed(2)}€</>
                    </span>
                  )}
                </p>
              )}
              <Link href={routes().cart().index()} className="btn-primary block mt-2 text-center">
                Voir le panier
              </Link>
            </div>
          </div>
        </Transition>
      </div>
    </>
  );
}

function OffersPreview({ cartTotal }: { cartTotal?: number }) {
  const cmsOffersQuery = useQuery({
    queryKey: ['cms', 'offers'],
    queryFn: () => fetchFromCMS<Offers>('offers'),
  });

  if (!cmsOffersQuery.data) return null;

  const { giftThreshold, freeShippingThreshold } = cmsOffersQuery.data;

  const offerGift = cartTotal !== undefined && giftThreshold !== null && cartTotal >= giftThreshold;
  const offerShipping = cartTotal !== undefined && freeShippingThreshold !== null && cartTotal >= freeShippingThreshold;

  return (
    <>
      {offerGift && (
        <div className="flex justify-between gap-2">
          <Image
            src="/images/gift.webp"
            width={128}
            height={128}
            className="w-32 h-32 object-contain object-center"
            alt="Image d'un paquet cadeau"
          />
          <div className="flex flex-col justify-center py-2">
            <p>Cadeau offert</p>
            <p className="font-bold text-end">0.00€</p>
          </div>
        </div>
      )}
      {offerShipping && (
        <div className="flex justify-between gap-2">
          <Image
            src="/images/gift.webp"
            width={128}
            height={128}
            className="w-32 h-32 object-contain object-center"
            alt="Image d'un paquet cadeau"
          />
          <div className="flex flex-col justify-center py-2">
            <p>Frais de ports offerts</p>
            <p className="font-bold text-end">0.00€</p>
          </div>
        </div>
      )}
    </>
  );
}
