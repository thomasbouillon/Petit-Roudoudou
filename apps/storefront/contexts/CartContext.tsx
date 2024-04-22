'use client';

import React, { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { trpc } from '../trpc-client';
import { Cart } from '@prisma/client';
import { UseTRPCMutationResult, UseTRPCQueryResult } from '@trpc/react-query/dist/shared';
import { TRPCRouterInput } from '@couture-next/api-connector';

type CartContextValue = {
  getCartQuery: UseTRPCQueryResult<Cart | null, unknown>;
  addToCartMutation: UseTRPCMutationResult<any, unknown, TRPCRouterInput['carts']['addToMyCart'], unknown>;
  changeQuantityMutation: UseTRPCMutationResult<
    any,
    unknown,
    TRPCRouterInput['carts']['changeQuantityInMyCart'],
    unknown
  >;
  // changeQuantityMutation: UseMutationResult<void, Error, Record<string, number>>;
  // docRef: DocumentReference<Cart, Cart>;
};

export const CartContext = React.createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const prevCartItemCount = React.useRef<number | null>(null);

  const getCartQuery = trpc.carts.findMyCart.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const cartItemCount = getCartQuery.data?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  const trpcUtils = trpc.useUtils();
  useEffect(() => {
    trpcUtils.shipping.getAvailableOffersForMyCart.invalidate();
  }, [getCartQuery.data]);

  const posthog = usePostHog();
  useEffect(() => {
    if (prevCartItemCount.current !== cartItemCount) {
      posthog.setPersonProperties({
        cart_item_count: cartItemCount,
      });
    }
    prevCartItemCount.current = cartItemCount;
  }, [cartItemCount]);

  const addToCartMutation = trpc.carts.addToMyCart.useMutation({
    onSuccess: () => {
      trpcUtils.carts.findMyCart.invalidate();
    },
  });

  const changeQuantityMutation = trpc.carts.changeQuantityInMyCart.useMutation({
    onSuccess: () => {
      trpcUtils.carts.findMyCart.invalidate();
    },
  });

  // const callEditCartItemQuantity = useMemo(
  //   () => httpsCallable<CallEditCartMutationPayload, CallEditCartMutationResponse>(functions, 'callEditCart'),
  //   [functions]
  // );
  // const changeQuantityMutation = useMutation<void, Error, Record<string, number>, { getCartQueryKey: string[] }>({
  //   mutationFn: async (quantities) => {
  //     const toUpdate = Object.entries(quantities);
  //     for (let index = 0; index < toUpdate.length; index++) {
  //       const [itemIndex, newQuantity] = toUpdate[index];
  //       await callEditCartItemQuantity({
  //         type: 'change-item-quantity',
  //         index: parseInt(itemIndex),
  //         newQuantity,
  //       });
  //     }
  //   },
  //   onMutate: async (quantities) => {
  //     const prevItems = getCartQuery.data?.items ?? [];
  //     const queryKey = ['firestoreDocument', ...docRef.path.split('/')];
  //     await queryClient.cancelQueries({
  //       queryKey,
  //     });
  //     console.log('Setting query data');
  //     queryClient.setQueryData(queryKey, (prev: Cart | null) => {
  //       if (!prev) return prev;
  //       const next = { ...prev };
  //       next.items = prevItems
  //         .map((item, index) => ({
  //           ...item,
  //           quantity: quantities[index.toString()] ?? item.quantity,
  //           totalTaxExcluded: item.perUnitTaxExcluded * (quantities[index.toString()] ?? item.quantity),
  //           totalTaxIncluded: item.perUnitTaxIncluded * (quantities[index.toString()] ?? item.quantity),
  //         }))
  //         .filter((item) => item.quantity > 0);
  //       next.totalTaxExcluded = next.items.reduce((acc, item) => acc + item.totalTaxExcluded, 0);
  //       next.totalTaxIncluded = next.items.reduce((acc, item) => acc + item.totalTaxIncluded, 0);
  //       return next;
  //     });
  //     return { getCartQueryKey: queryKey };
  //   },
  //   onError: (_err, _variables, ctx) => {
  //     if (!ctx) return;
  //     queryClient.invalidateQueries({
  //       queryKey: ctx.getCartQueryKey,
  //     });
  //   },
  // });

  if (getCartQuery.isError) throw getCartQuery.error;

  return (
    <CartContext.Provider value={{ getCartQuery, addToCartMutation, changeQuantityMutation }}>
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
