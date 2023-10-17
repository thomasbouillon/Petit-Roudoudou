import { useMemo } from 'react';
import type { NewArticle } from '@couture-next/types';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { addDoc, collection } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

type Return = {
  newArticle: NewArticle;
  saveMutation: UseMutationResult<string, unknown, NewArticle, unknown>;
};

function useNewArticle(): Return {
  const database = useDatabase();

  const newArticle = useMemo<NewArticle>(
    () => ({
      name: '',
      slug: '',
      description: '',
      characteristics: {},
      seo: {
        title: '',
        description: '',
      },
      images: [],
      skus: [
        {
          uid: uuid(),
          characteristics: {},
          price: 0,
          stock: 0,
          weight: 0,
          enabled: true,
        },
      ],
    }),
    []
  );

  const saveMutation = useMutation(async (article) => {
    const docRef = await addDoc(collection(database, 'articles'), article);
    return docRef.id;
  }) satisfies Return['saveMutation'];

  return {
    newArticle,
    saveMutation,
  };
}

export default useNewArticle;
