import { useMemo } from 'react';
import type { Article, NewArticle } from '@couture-next/types';
import {
  UseMutationResult,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { addDoc, collection } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

type Return = {
  newArticle: NewArticle;
  saveMutation: UseMutationResult<Article['_id'], unknown, NewArticle, unknown>;
};

function useNewArticle(): Return {
  const database = useDatabase();
  const queryClient = useQueryClient();

  const newArticle = useMemo<NewArticle>(
    () => ({
      name: '',
      slug: '',
      description: '',
      treeJsModel: {
        uid: '',
        url: '',
      },
      characteristics: {},
      customizables: [],
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
          weight: 0,
          enabled: true,
        },
      ],
      stocks: [],
    }),
    []
  );

  const saveMutation = useMutation({
    mutationFn: async (article) => {
      const docRef = await addDoc(collection(database, 'articles'), article);
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles.all'] });
    },
  }) satisfies Return['saveMutation'];

  return {
    newArticle,
    saveMutation,
  };
}

export default useNewArticle;
