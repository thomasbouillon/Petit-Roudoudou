import { useMemo } from 'react';
import type { Fabric, NewFabric } from '@couture-next/types';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { addDoc, collection } from 'firebase/firestore';

type Return = {
  newFabric: NewFabric;
  saveMutation: UseMutationResult<Fabric['_id'], unknown, NewFabric, unknown>;
};

function useNewFabric(): Return {
  const database = useDatabase();

  const newFabric = useMemo<NewFabric>(
    () => ({
      name: '',
      image: { url: '' },
      groupIds: [],
    }),
    []
  );

  const saveMutation = useMutation(async (fabric) => {
    const snapshot = await addDoc(collection(database, 'fabrics'), fabric);
    return snapshot.id;
  }) satisfies Return['saveMutation'];

  return {
    newFabric,
    saveMutation,
  };
}

export default useNewFabric;
