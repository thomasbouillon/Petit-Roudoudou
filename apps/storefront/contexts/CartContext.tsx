'use client';

import React, { useEffect, useMemo } from 'react';
import { trpc } from '../trpc-client';
import { UseTRPCMutationResult, UseTRPCQueryResult } from '@trpc/react-query/dist/shared';
import { TRPCRouterInput, TRPCRouterOutput } from '@couture-next/api-connector';
import { useQuery } from '@tanstack/react-query';
import { Offers, fetchFromCMS } from '../directus';
import toast from 'react-hot-toast';

type CartContextValue = {
  getCartQuery: UseTRPCQueryResult<TRPCRouterOutput['carts']['findMyCart'], unknown>;
  addToCartMutation: UseTRPCMutationResult<any, unknown, TRPCRouterInput['carts']['addToMyCart'], unknown>;
  changeQuantityMutation: UseTRPCMutationResult<
    any,
    unknown,
    TRPCRouterInput['carts']['changeQuantityInMyCart'],
    unknown
  >;
  offerShipping: boolean;
  offerGift: boolean;
};

export const CartContext = React.createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const getCartQuery = trpc.carts.findMyCart.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5,
  });

  const trpcUtils = trpc.useUtils();
  useEffect(() => {
    trpcUtils.shipping.getAvailableOffersForMyCart.invalidate();
  }, [getCartQuery.data]);

  const addToCartMutation = trpc.carts.addToMyCart.useMutation({
    onSuccess: () => {
      trpcUtils.carts.findMyCart.invalidate();
    },
    onError: (error) => {
      const cause = error.data?.cause;
      if (cause && cause === 'NOT_ENOUGH_STOCK') {
        toast.error('Tu as déjà tout le stock de cet article dans ton panier');
      } else {
        toast.error('Une erreur est survenue');
      }
    },
  });

  const changeQuantityMutation = trpc.carts.changeQuantityInMyCart.useMutation({
    onSuccess: () => {
      trpcUtils.carts.findMyCart.invalidate();
    },
    onError: (error) => {
      const cause = error.data?.cause;
      if (cause && cause === 'NOT_ENOUGH_STOCK') {
        toast.error('Tu as déjà tout le stock de cet article dans ton panier');
      } else {
        toast.error('Une erreur est survenue');
      }
    },
  });

  const cartTotalTaxIncludedWithOutGiftCards = useMemo(() => {
    if (!getCartQuery.data) return 0;
    return getCartQuery.data.items
      .filter((item) => item.type !== 'giftCard')
      .reduce((acc, item) => acc + item.totalTaxIncluded, 0);
  }, [getCartQuery.data]);

  const cmsOffersQuery = useQuery({
    queryKey: ['cms', 'offers'],
    queryFn: () => fetchFromCMS<Offers>('offers'),
  });

  const offerGift =
    !!cartTotalTaxIncludedWithOutGiftCards &&
    !!cmsOffersQuery.data?.giftThreshold &&
    cartTotalTaxIncludedWithOutGiftCards >= cmsOffersQuery.data?.giftThreshold;
  const offerShipping =
    !!cartTotalTaxIncludedWithOutGiftCards &&
    !!cmsOffersQuery.data?.freeShippingThreshold &&
    cartTotalTaxIncludedWithOutGiftCards >= cmsOffersQuery.data?.freeShippingThreshold;

  if (getCartQuery.isError) throw getCartQuery.error;

  return (
    <CartContext.Provider value={{ getCartQuery, addToCartMutation, changeQuantityMutation, offerGift, offerShipping }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
