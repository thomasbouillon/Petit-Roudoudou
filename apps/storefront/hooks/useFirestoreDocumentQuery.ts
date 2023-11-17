import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  DocumentData,
  DocumentReference,
  onSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { useEffect } from 'react';

export function useFirestoreDocumentQuery<
  TAppData = DocumentData,
  TDbData extends DocumentData = DocumentData
>(
  ref: DocumentReference<TAppData, TDbData>,
  options?: Omit<
    UseQueryOptions<TAppData | null, FirestoreError>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TAppData | null, FirestoreError> {
  const queryClient = useQueryClient();

  const query = useQuery<TAppData | null, FirestoreError>({
    queryKey: ['firestoreDocument', ...ref.path.split('/')],
    queryFn: () =>
      new Promise((resolve, reject) => {
        const unsub = onSnapshot(
          ref,
          (snapshot) => {
            // Listen for first value
            resolve(snapshot.exists() ? snapshot.data() : null);
            unsub();
          },
          reject
        );
      }),
    ...options,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        // Listen for incoming updates
        queryClient.setQueryData(
          ['firestoreDocument', ...ref.path.split('/')],
          snapshot.exists() ? snapshot.data() : null
        );
      },
      () => {
        // on error, force a re-fetch
        query.refetch();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [queryClient, ref, query.refetch]);

  return query;
}
