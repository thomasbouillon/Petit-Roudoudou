'use client';

import {
  CallAddToCartMutationPayload,
  CallAddToCartMutationResponse,
  Cart,
} from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
} from '@tanstack/react-query';
import React, { useMemo } from 'react';
import useDatabase from '../hooks/useDatabase';
import {
  DocumentReference,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  collection,
  doc,
} from 'firebase/firestore';
import useFunctions from '../hooks/useFunctions';
import { httpsCallable } from 'firebase/functions';
import { useFirestoreDocumentQuery } from '../hooks/useFirestoreDocumentQuery';
import { useAuth } from './AuthContext';

type CartContextValue = {
  getCartQuery: UseQueryResult<Cart | null>;
  addToCartMutation: UseMutationResult<
    CallAddToCartMutationResponse,
    unknown,
    CallAddToCartMutationPayload,
    unknown
  >;
  docRef: DocumentReference<Cart, Cart>;
};

const firestoreCartConverter: FirestoreDataConverter<Cart, Cart> = {
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as Cart,
  toFirestore: (cart: Cart) => cart,
};

export const CartContext = React.createContext<CartContextValue | undefined>(
  undefined
);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const database = useDatabase();
  const { userQuery } = useAuth();
  const functions = useFunctions();

  const docRef = useMemo(
    () =>
      doc(
        collection(database, 'carts'),
        userQuery.data?.uid ?? 'will-not-be-used'
      ).withConverter(firestoreCartConverter),
    [database, userQuery.data?.uid]
  );

  const getCartQuery = useFirestoreDocumentQuery(docRef, {
    enabled: !!userQuery.data?.uid,
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
  });

  if (getCartQuery.isError) throw getCartQuery.error;

  return (
    <CartContext.Provider value={{ getCartQuery, addToCartMutation, docRef }}>
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
