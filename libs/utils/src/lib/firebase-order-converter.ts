import { FirestoreDataConverter, Timestamp } from 'firebase/firestore';
import { Order } from '@couture-next/types';

export const firestoreOrderConverter = {
  fromFirestore: (snap) => {
    const original = snap.data();
    return {
      ...original,
      _id: snap.id,
      createdAt: new Timestamp(
        original['createdAt']['seconds'],
        original['createdAt']['nanoseconds']
      ).toDate(),
    } as Order;
  },
  toFirestore: (model: Order) => {
    const payload = { ...model, _id: undefined };
    delete payload._id;
    if (!payload.createdAt) payload.createdAt = new Date();
    return payload;
  },
} satisfies FirestoreDataConverter<Order>;
