import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { useMemo } from 'react';
import app from '../firebase';

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(getFirestore(app), '127.0.0.1', 8080);
}

export default function useDatabase() {
  return useMemo(() => getFirestore(app), []);
}
