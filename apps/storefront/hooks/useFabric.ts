import type { Fabric } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

type Return = {
  query: UseQueryResult<Fabric>;
  saveMutation: UseMutationResult<Fabric, unknown, Fabric, unknown>;
};

function useFabric(id: string): Return {
  const database = useDatabase();

  const getFabricQuery = useQuery(
    ['getFabric'],
    async () => {
      if (!id) throw Error('Impossible');
      const snapshot = await getDoc(doc(collection(database, 'fabrics'), id));
      if (!snapshot.exists()) throw Error('Not found');
      const result = snapshot.data() as Fabric;
      return result;
    },
    {
      enabled: !!id,
    }
  );

  const mutation = useMutation(async (fabric: Fabric) => {
    const toSet = { ...fabric, _id: undefined };
    await setDoc(doc(collection(database, 'fabrics'), fabric._id), toSet);
    return fabric;
  });

  return {
    query: getFabricQuery,
    saveMutation: mutation,
  };
}

export default useFabric;
