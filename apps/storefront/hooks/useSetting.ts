import { Setting } from '@couture-next/types';
import useDatabase from './useDatabase';
import { useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';
import { useFirestoreDocumentQuery } from './useFirestoreDocumentQuery';

export default function <TDefault>(key: Setting['_id'], defaultValue: TDefault) {
  const database = useDatabase();
  const settingRef = useMemo(
    () => doc(collection(database, 'settings'), key).withConverter(firestoreConverterAddRemoveId<Setting>()),
    [key]
  );
  const settingQuery = useFirestoreDocumentQuery(settingRef);

  return settingQuery.data?.value ?? defaultValue;
}
