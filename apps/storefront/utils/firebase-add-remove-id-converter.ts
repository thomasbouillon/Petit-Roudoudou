import { FirestoreDataConverter } from 'firebase/firestore';

export default function converter<
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
