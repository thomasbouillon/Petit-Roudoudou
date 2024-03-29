import { QueryDocumentSnapshot, type FirestoreDataConverter } from 'firebase/firestore';
import {
  type FirestoreDataConverter as AdminFirestoreDataConverter,
  QueryDocumentSnapshot as AdminQueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { NewDraftOrder, NewWaitingBankTransferOrder, Order, PaidOrder } from '@couture-next/types';

type OrderInDb = Omit<Order, '_id' | 'createdAt'> & {
  createdAt: number;
};

const fromFirestore = (snap: QueryDocumentSnapshot | AdminQueryDocumentSnapshot) => {
  const original = snap.data() as OrderInDb;
  return {
    ...original,
    _id: snap.id,
    createdAt: new Date(original['createdAt']),
    paidAt: original['status'] === 'paid' ? new Date((original as unknown as PaidOrder)['paidAt']) : undefined,
    archivedAt: original['archivedAt'] ? new Date(original['archivedAt']) : undefined,
  } as Order;
};

const toFirestore = (model: Order | NewDraftOrder | NewWaitingBankTransferOrder) => {
  const payload = { ...model, _id: undefined };
  delete payload._id;
  const createdAt = (model._id ? model.createdAt : new Date()).getTime();
  const paidAt = (model as PaidOrder).paidAt?.getTime();
  const archivedAt = (model as any).archivedAt?.getTime() ?? null;

  const future = { ...payload, createdAt, archivedAt };
  if (paidAt) {
    (future as any).paidAt = paidAt;
  }

  return future;
};

export const firestoreOrderConverter: FirestoreDataConverter<Order, OrderInDb> = {
  fromFirestore: (snap) => fromFirestore(snap) as Order,
  toFirestore: (data) => toFirestore(data as Order),
};

export const adminFirestoreOrderConverter: AdminFirestoreDataConverter<Order> = {
  fromFirestore,
  toFirestore: (data) => toFirestore(data as Order),
};

export const adminFirestoreNewDraftOrderConverter: AdminFirestoreDataConverter<NewDraftOrder> = {
  fromFirestore: () => {
    throw 'Makes no sens';
  },
  toFirestore: (data) => toFirestore(data as NewDraftOrder),
};

export const adminFirestoreNewWaitingBankTransferOrder: AdminFirestoreDataConverter<NewWaitingBankTransferOrder> = {
  fromFirestore: () => {
    throw 'Makes no sens';
  },
  toFirestore: (data) => toFirestore(data as NewWaitingBankTransferOrder),
};
