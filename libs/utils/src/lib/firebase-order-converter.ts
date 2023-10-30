import { type FirestoreDataConverter } from 'firebase/firestore';
import { Order } from '@couture-next/types';

export const firestoreOrderConverter = {
  fromFirestore: (snap) => {
    const original = snap.data();
    return {
      ...original,
      _id: snap.id,
      createdAt: new Date(
        original['createdAt']['seconds'] * 1_000 +
          original['createdAt']['nanoseconds'] / 1_000_000
      ),
    } as Order;
  },
  toFirestore: (model: Order) => {
    const payload = { ...model, _id: undefined };
    delete payload._id;
    if (!payload.createdAt) payload.createdAt = new Date();
    return payload;
  },
} satisfies FirestoreDataConverter<Order>;
