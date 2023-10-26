'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Transition } from '@headlessui/react';
import { ReactComponent as CartIcon } from '../assets/cart.svg';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';

export function CartPreview() {
  const [expanded, setExpanded] = useState(false);
  const {
    getCartQuery: { data: cart, isLoading, isError, error },
    docRef: cartDocRef,
  } = useCart();
  if (isError) throw error;

  // Reset expanded state when cart changes (except on first load)
  const isFirstLoadForRef = useRef(true);
  useEffect(() => {
    isFirstLoadForRef.current = true;
  }, [cartDocRef]);
  useEffect(() => {
    if (isLoading) return; // ignore triggers while first load is not finished
    if (isFirstLoadForRef.current) {
      isFirstLoadForRef.current = false;
      return;
    }
    setExpanded(true);
  }, [cart, isLoading]);

  return (
    <>
      <button
        className="relative pr-2.5 text-primary-100"
        aria-controls="cart-preview"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(true);
        }}
      >
        <CartIcon className="w-8 h-8" />
        <span className="sr-only">
          {expanded ? 'Fermer le panier' : 'Ouvrir le panier'}
        </span>
        <span className="absolute top-0 right-0 -translate-y-1/2" aria-hidden>
          {isLoading ? '-' : cart?.items.length ?? 0}
        </span>
        <span className="sr-only">
          Le panier contient {cart?.items.length ?? 0} articles
        </span>
      </button>
      <div id="cart-preview">
        <Transition
          show={expanded}
          className="fixed flex flex-col top-0 right-0 px-4 py-8 z-[51] md:max-w-xs w-screen h-screen shadow-[0_0_10px_0_rgba(0,0,0,0.2)] bg-light-100"
          enter="transition-transform"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition-transform"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <h2 className="text-3xl font-serif text-center mb-8 px-6">
            Votre panier
          </h2>
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
            <div className="">
              {(cart?.items.length ?? 0) === 0 && (
                <p className="text-center">Votre panier est vide</p>
              )}
              {cart?.items.map((item) => (
                <div key={item.skuId} className="flex items-center">
                  <Image
                    src={item.image}
                    width={128}
                    height={128}
                    className="w-32 h-32 object-contain object-center"
                    alt=""
                  />
                  <div className="flex flex-col items-end gap-4">
                    <p>{item.description}</p>
                    <p>{item.totalTaxIncluded.toFixed(2)}€</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-light-100 pt-4">
            {(cart?.items.length ?? 0) > 0 && (
              <p className="text-center">
                Total: {(cart?.totalTaxIncluded ?? 0).toFixed(2)} €
              </p>
            )}
            <Link
              href="/panier"
              className="btn-primary block mt-2 text-center"
              onClick={() => setExpanded(false)}
            >
              Voir le panier
            </Link>
          </div>
        </Transition>
      </div>
    </>
  );
}
