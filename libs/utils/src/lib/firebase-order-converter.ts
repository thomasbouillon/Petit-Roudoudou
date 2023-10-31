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

export const firestoreOrderConverter = {
  fromFirestore,
  toFirestore: (data) => toFirestore(data as Order),
} satisfies FirestoreDataConverter<Order, OrderInDb>;

export const adminFirestoreOrderConverter = {
  fromFirestore,
  toFirestore: (data) => toFirestore(data as Order),
} satisfies AdminFirestoreDataConverter<Order>;

export const firestoreNewDraftOrderConverter = {
  fromFirestore: () => {
    throw 'Makes no sens';
  },
  toFirestore: (data) => toFirestore(data as NewDraftOrder),
} satisfies FirestoreDataConverter<NewDraftOrder, OrderInDb>;

export const adminFirestoreNewDraftOrderConverter = {
  fromFirestore: () => {
    throw 'Makes no sens';
  },
  toFirestore: (data) => toFirestore(data as NewDraftOrder),
} satisfies AdminFirestoreDataConverter<NewDraftOrder>;
