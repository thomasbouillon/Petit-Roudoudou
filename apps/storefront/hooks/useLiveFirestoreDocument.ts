// Original https://github.com/invertase/react-query-firebase

/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  onSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { useSubscription } from './useSubscription';
import { useCallback } from 'react';

type NextOrObserver<T> = (data: T | null) => Promise<void>;

export function useLiveFirestoreDocument<
  TAppData = DocumentData,
  TDbData extends DocumentData = DocumentData
>(
  queryKey: QueryKey,
  ref: DocumentReference<TAppData, TDbData>,
  useQueryOptions?: Omit<
    UseQueryOptions<TAppData, FirestoreError, TAppData>,
    'queryFn'
  >
): UseQueryResult<TAppData, FirestoreError> {
  const subscribeFn = useCallback(
    (callback: NextOrObserver<TAppData>) => {
      console.log('LISTENING');

      return onSnapshot(
        ref,
        (snapshot: DocumentSnapshot<TAppData, TDbData>) => {
          // Set the data each time state changes.
          if (!snapshot.exists()) callback(null);
          const data = snapshot.data() as TAppData;
          return callback(data);
        }
      );
    },
    [ref]
  );

  return useSubscription<TAppData, FirestoreError>(
    queryKey,
    ['useFirestoreDocument', queryKey],
    subscribeFn,
    useQueryOptions
  );
}
