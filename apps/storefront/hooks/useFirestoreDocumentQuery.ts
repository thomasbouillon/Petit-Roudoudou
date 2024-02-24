import { UseQueryOptions, UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentData, DocumentReference, onSnapshot, FirestoreError, getDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

export function useFirestoreDocumentQuery<TAppData = DocumentData, TDbData extends DocumentData = DocumentData>(
  ref: DocumentReference<TAppData, TDbData>,
  options?: Omit<UseQueryOptions<TAppData | null, FirestoreError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TAppData | null, FirestoreError> {
  const queryClient = useQueryClient();

  const query = useQuery<TAppData | null, FirestoreError>({
    queryKey: ['firestoreDocument', ...ref.path.split('/')],
    queryFn: () => getDoc(ref).then((snapshot) => (snapshot.exists() ? snapshot.data() : null)),
    ...options,
  });

  useEffect(() => {
    const queryKey = ['firestoreDocument', ...ref.path.split('/')];
    let isFirst = true;
    const unsub = onSnapshot(ref, (snapshot) => {
      if (query.isFetching) return; // let getDoc handle first fetch
      if (isFirst) return; // avoid setting the data twice after getDoc
      isFirst = false;
      queryClient.setQueryData<TAppData | null>(queryKey, snapshot.exists() ? snapshot.data() : null);
    });

    return () => {
      unsub();
    };
  }, [ref]);

  return query;
}
