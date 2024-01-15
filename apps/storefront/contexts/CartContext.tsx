'use client';

import { CallEditCartMutationPayload, CallEditCartMutationResponse, Cart } from '@couture-next/types';
import { UseMutationResult, UseQueryResult, useMutation } from '@tanstack/react-query';
import React, { useEffect, useMemo } from 'react';
import useDatabase from '../hooks/useDatabase';
import { DocumentReference, FirestoreDataConverter, QueryDocumentSnapshot, collection, doc } from 'firebase/firestore';
import useFunctions from '../hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { useFirestoreDocumentQuery } from '../hooks/useFirestoreDocumentQuery';
import { useAuth } from './AuthContext';
import { usePostHog } from 'posthog-js/react';

type CartContextValue = {
  getCartQuery: UseQueryResult<Cart | null>;
  addToCartMutation: UseMutationResult<CallEditCartMutationResponse, unknown, CallEditCartMutationPayload, unknown>;
  docRef: DocumentReference<Cart, Cart>;
};

const firestoreCartConverter: FirestoreDataConverter<Cart, Cart> = {
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as Cart,
  toFirestore: (cart: Cart) => cart,
};

export const CartContext = React.createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const database = useDatabase();
  const { userQuery } = useAuth();
  const functions = useFunctions();

  const prevCartItemCount = React.useRef<number | null>(null);

  const docRef = useMemo(
    () =>
      doc(collection(database, 'carts'), userQuery.data?.uid ?? 'will-not-be-used').withConverter(
        firestoreCartConverter
      ),
    [database, userQuery.data?.uid]
  );

  const getCartQuery = useFirestoreDocumentQuery(docRef, {
    enabled: !!userQuery.data?.uid,
  });

  const cartItemCount = getCartQuery.data?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  const posthog = usePostHog();
  useEffect(() => {
    if (prevCartItemCount.current !== cartItemCount) {
      posthog.setPersonProperties({
        cart_item_count: cartItemCount,
      });
    }
    prevCartItemCount.current = cartItemCount;
  }, [cartItemCount]);

  const addToCartMutation = useMutation({
    mutationKey: ['addToCart'],
    mutationFn: async (payload: CallEditCartMutationPayload) => {
      const mutate = httpsCallable<CallEditCartMutationPayload, CallEditCartMutationResponse>(
        functions,
        'callEditCart'
      );
      return await mutate(payload).then((r) => r.data);
    },
  });

  if (getCartQuery.isError) throw getCartQuery.error;

  return <CartContext.Provider value={{ getCartQuery, addToCartMutation, docRef }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
