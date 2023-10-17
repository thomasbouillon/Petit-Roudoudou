'use client';

import { useState } from 'react';
import type { Fabric } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';

type BasicReturn = {
  fabric: Fabric;
  setFabric: (fabric: Fabric) => void;
  saveMutation: UseMutationResult<Fabric, unknown, Fabric, unknown>;
};

type ReturnWithQuery = {
  query: UseQueryResult<Fabric>;
  fabric: Fabric | null;
  setFabric: (fabric: Fabric) => void;
  saveMutation: UseMutationResult<Fabric, unknown, Fabric, unknown>;
};

function useFabric(id: string): ReturnWithQuery;
function useFabric(): BasicReturn;
function useFabric(id?: string): ReturnWithQuery | BasicReturn {
  const database = useDatabase();

  const [fabric, setFabric] = useState<Fabric | null>(
    id === undefined
      ? {
          name: '',
          image: { url: '' },
        }
      : null
  );

  const getFabricQuery = useQuery(
    ['getFabric'],
    async () => {
      if (!id && !fabric?._id) throw Error('Impossible');
      const snapshot = await getDoc(
        doc(collection(database, 'fabrics'), fabric?._id || id)
      );
      if (!snapshot.exists()) throw Error('Not found');
      const result = snapshot.data() as Fabric;
      setFabric(result);
      return result;
    },
    {
      enabled: !!id || !!fabric?._id,
    }
  );

  const mutation = useMutation(async (fabric: Fabric) => {
    if (fabric._id) {
      const toSet = { ...fabric };
      delete toSet._id;
      await setDoc(doc(collection(database, 'fabrics'), fabric._id), toSet);
    } else {
      const docRef = await addDoc(collection(database, 'fabrics'), fabric);
      fabric._id = docRef.id;
    }
    setFabric(fabric);
    return fabric;
  });

  if (id !== undefined) {
    return {
      fabric,
      setFabric,
      saveMutation: mutation,
      query: getFabricQuery,
    };
  }

  return {
    fabric: fabric as Fabric,
    saveMutation: mutation,
    setFabric,
  };
}

export default useFabric;
