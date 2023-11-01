import {
  QueryDocumentSnapshot,
  type FirestoreDataConverter,
} from 'firebase/firestore';
import {
  type FirestoreDataConverter as AdminFirestoreDataConverter,
  QueryDocumentSnapshot as AdminQueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { NewDraftOrder, Order } from '@couture-next/types';

type OrderInDb = Omit<Order, '_id' | 'createdAt'> & {
  createdAt: number;
};

const fromFirestore = (
  snap: QueryDocumentSnapshot | AdminQueryDocumentSnapshot
) => {
  const original = snap.data();
  return {
    ...original,
    _id: snap.id,
    createdAt: new Date(
      original['createdAt']['seconds'] * 1_000 +
        original['createdAt']['nanoseconds'] / 1_000_000
    ),
  } as Order;
};

const toFirestore = (model: Order | NewDraftOrder) => {
  const payload = { ...model, _id: undefined };
  delete payload._id;
  const createdAt = (model._id ? model.createdAt : new Date()).getTime();
  return { ...payload, createdAt } as OrderInDb;
};

export const firestoreOrderConverter: FirestoreDataConverter<Order, OrderInDb> =
  {
    fromFirestore: (snap) => fromFirestore(snap) as Order,
    toFirestore: (data) => toFirestore(data as Order),
  };

export const adminFirestoreOrderConverter: AdminFirestoreDataConverter<Order> =
  {
    fromFirestore,
    toFirestore: (data) => toFirestore(data as Order),
  };

export const firestoreNewDraftOrderConverter: FirestoreDataConverter<
  NewDraftOrder,
  OrderInDb
> = {
  fromFirestore: () => {
    throw 'Makes no sens';
  },
  toFirestore: (data) => toFirestore(data as NewDraftOrder),
};

export const adminFirestoreNewDraftOrderConverter: AdminFirestoreDataConverter<NewDraftOrder> =
  {
    fromFirestore: () => {
      throw 'Makes no sens';
    },
    toFirestore: (data) => toFirestore(data as NewDraftOrder),
  };
