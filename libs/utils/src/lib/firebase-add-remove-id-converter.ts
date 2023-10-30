import { FirestoreDataConverter } from 'firebase/firestore';
import { FirestoreDataConverter as AdminFirestoreDataConverter } from 'firebase-admin/firestore';

export function firestoreConverterAddRemoveId<
  T extends { _id: unknown }
>(): FirestoreDataConverter<T, Omit<T, '_id'>> {
  return {
    fromFirestore: (snap) => ({ ...snap.data(), _id: snap.id } as T),
    toFirestore: (model: T) => {
      const payload = { ...model, _id: undefined };
      delete payload._id;
      return payload;
    },
  };
}

export function adminFirestoreConverterAddRemoveId<
  T extends { _id: unknown }
>(): AdminFirestoreDataConverter<T> {
  return {
    fromFirestore: (snap) => ({ ...snap.data(), _id: snap.id } as T),
    toFirestore: (model: T) => {
      const payload = { ...model, _id: undefined };
      delete payload._id;
      return payload;
    },
  };
}
