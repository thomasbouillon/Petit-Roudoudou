import { type FirestoreDataConverter } from 'firebase/firestore';
import { GiftCard, SafeOmit } from '@couture-next/types';

type GiftCardInFirestore = SafeOmit<GiftCard, '_id' | 'createdAt'> & {
  createdAt: number;
};

export const firestoreGiftCardConverter: FirestoreDataConverter<GiftCard, GiftCardInFirestore> = {
  fromFirestore: (snap) => {
    const original = snap.data() as GiftCardInFirestore;
    return {
      _id: snap.id,
      ...original,
      createdAt: new Date(original['createdAt']),
    } satisfies GiftCard;
  },
  toFirestore: (data) => {
    delete (data as any)._id;
    let createdAt: number | undefined = undefined;
    if (data._id) {
      if (data.createdAt !== undefined && 'getTime' in data.createdAt && typeof data.createdAt.getTime === 'function')
        createdAt = data.createdAt.getTime();
      else createdAt = data.createdAt as any;
    } else {
      createdAt = new Date().getTime();
    }
    const future = { ...data, createdAt };
    return future as GiftCardInFirestore;
  },
};
