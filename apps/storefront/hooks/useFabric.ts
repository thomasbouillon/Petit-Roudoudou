import type { Fabric } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';

type Return = {
  query: UseQueryResult<Fabric>;
  saveMutation: UseMutationResult<Fabric, unknown, Fabric, unknown>;
};

function useFabric(id: string): Return {
  const database = useDatabase();

  const getFabricQuery = useQuery(
    ['fabrics.find', id],
    async () => {
      if (!id) throw Error('Impossible');
      const snapshot = await getDoc(
        doc(collection(database, 'fabrics'), id).withConverter(
          firestoreConverterAddRemoveId<Fabric>()
        )
      );
      if (!snapshot.exists()) throw Error('Not found');
      return snapshot.data();
    },
    {
      enabled: !!id,
    }
  );

  const mutation = useMutation(async (fabric: Fabric) => {
    await setDoc(
      doc(collection(database, 'fabrics'), fabric._id).withConverter(
        firestoreConverterAddRemoveId<Fabric>()
      ),
      fabric
    );
    return fabric;
  });

  return {
    query: getFabricQuery,
    saveMutation: mutation,
  };
}

export default useFabric;
