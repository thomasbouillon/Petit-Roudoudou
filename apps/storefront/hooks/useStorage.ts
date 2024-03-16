import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { useCallback, useMemo } from 'react';
import app from '../firebase';

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

if (process.env.NODE_ENV === 'development') connectStorageEmulator(getStorage(app), '127.0.0.1', 9199);

export default function useStorage() {
  const storage = useMemo(() => {
    const storage = getStorage(app);
    return storage;
  }, []);

  const handleUpload = useCallback(
    async (file: File, onProgressCallback?: (n: number) => void) => {
      const fileExtension = file.name.split('.').pop();
      const fileRef = ref(storage, 'uploaded/' + uuidv4() + '.' + fileExtension);
      const uploadTask = uploadBytesResumable(fileRef, file);

      if (onProgressCallback) {
        onProgressCallback(0);
        uploadTask.on('state_changed', (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgressCallback(progress);
        });
      }

      // Wait for the upload to complete
      await new Promise<void>((resolve, reject) => uploadTask.on('state_changed', undefined, reject, resolve));

      const url = await getDownloadURL(uploadTask.snapshot.ref);
      return { uid: fileRef.fullPath, url };
    },
    [storage]
  );

  return { ...storage, handleUpload };
}
