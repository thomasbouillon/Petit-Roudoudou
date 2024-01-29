import { UseQueryOptions, UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentData, DocumentReference, onSnapshot, FirestoreError } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

export function useFirestoreDocumentQuery<TAppData = DocumentData, TDbData extends DocumentData = DocumentData>(
  ref: DocumentReference<TAppData, TDbData>,
  options?: Omit<UseQueryOptions<TAppData | null, FirestoreError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TAppData | null, FirestoreError> {
  const queryClient = useQueryClient();
  const allSubscriptions = useRef<(() => void)[]>([]);

  const query = useQuery<TAppData | null, FirestoreError>({
    queryKey: ['firestoreDocument', ...ref.path.split('/')],
    queryFn: () => {
      let resolved = false;
      return new Promise((resolve, reject) => {
        const unsub = onSnapshot(
          ref,
          (snapshot) => {
            const data = snapshot.exists() ? snapshot.data() : null;
            if (!resolved) {
              resolved = true;
              resolve(data);
            } else {
              queryClient.setQueryData(['firestoreDocument', ...ref.path.split('/')], data);
            }
          },
          reject
        );
        allSubscriptions.current.push(unsub);
      });
    },
    ...options,
  });

  useEffect(() => {
    return () => {
      allSubscriptions.current.forEach((unsub) => unsub());
      allSubscriptions.current = [];
    };
  }, [queryClient, ref]);

  return query;
}
