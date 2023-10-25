'use client';

import {
  CallAddToCartMutationPayload,
  CallAddToCartMutationResponse,
  Cart,
  CartItem,
} from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import React from 'react';
import useDatabase from '../hooks/useDatabase';
import { useAuth } from './AuthContext';
import { collection, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import useFunctions from '../hooks/useFunctions';

type CartContextValue = {
  getCartQuery: UseQueryResult<Cart | null>;
  addToCartMutation: UseMutationResult<
    CallAddToCartMutationResponse,
    unknown,
    CartItem,
    unknown
  >;
};

export const enum CartEvents {
  PRODUCT_ADDED = 'PRODUCT_ADDED',
}

export const CartContext = React.createContext<CartContextValue | undefined>(
  undefined
);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const database = useDatabase();
  const { user } = useAuth();
  const functions = useFunctions();

  const queryClient = useQueryClient();

  const getCartQuery = useQuery(['cart'], {
    queryFn: () =>
      user
        ? getDoc(doc(collection(database, 'carts'), user.uid))
            .catch(() => null)
            .then((snapshot) => {
              if (snapshot?.exists())
                return { _id: snapshot.id, ...(snapshot.data() as Cart) };
              return null;
            })
        : null,
  });

  const addToCartMutation = useMutation({
    mutationKey: ['addToCart'],
    mutationFn: async (payload: CallAddToCartMutationPayload) => {
      const mutate = httpsCallable<
        CallAddToCartMutationPayload,
        CallAddToCartMutationResponse
      >(functions, 'callEditCart');
      return await mutate(payload).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  if (getCartQuery.isError) throw getCartQuery.error;

  return (
    <CartContext.Provider value={{ getCartQuery, addToCartMutation }}>
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
