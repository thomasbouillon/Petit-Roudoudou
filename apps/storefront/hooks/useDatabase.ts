import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import app from '../firebase';

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
}

export const firestore = getFirestore(app);

export default function useDatabase() {
  return firestore;
}
