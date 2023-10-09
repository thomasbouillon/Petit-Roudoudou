import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { useMemo } from 'react';
import app from '../firebase';

if (process.env.NODE_ENV === 'development')
  connectStorageEmulator(getStorage(app), '127.0.0.1', 9199);

export default function useStorage() {
  const storage = useMemo(() => {
    const storage = getStorage(app);
    return storage;
  }, []);

  return storage;
}
