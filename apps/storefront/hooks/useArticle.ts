'use client';

import { useState } from 'react';
import type { Article } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';

type BasicReturn = {
  article: Article;
  setArticle: (article: Article) => void;
  saveMutation: UseMutationResult<Article, unknown, Article, unknown>;
};

type ReturnWithQuery = {
  query: UseQueryResult<Article>;
  article: Article | null;
  setArticle: (article: Article) => void;
  saveMutation: UseMutationResult<Article, unknown, Article, unknown>;
};

function useArticle(id: string): ReturnWithQuery;
function useArticle(): BasicReturn;
function useArticle(id?: string): ReturnWithQuery | BasicReturn {
  const database = useDatabase();

  const [article, setArticle] = useState<Article | null>(
    id === undefined
      ? {
          name: '',
          description: '',
          characteristics: {},
          seo: {
            title: '',
            description: '',
          },
          images: [],
          skus: [
            {
              characteristics: {},
              price: 0,
              stock: 0,
              weight: 0,
              enabled: true,
            },
          ],
        }
      : null
  );

  const query = useQuery(
    ['getArticle'],
    async () => {
      const snapshot = await getDoc(doc(collection(database, 'articles'), id));
      if (!snapshot.exists()) throw Error('Not found');
      const article = snapshot.data() as Article;
      setArticle(article);
      return article;
    },
    {
      enabled: !!id || !!article?._id,
    }
  );

  const mutation = useMutation(async (article: Article) => {
    if (article._id) {
      const toSet = { ...article };
      delete toSet._id;
      await setDoc(doc(collection(database, 'articles'), article._id), toSet);
    } else {
      const docRef = await addDoc(collection(database, 'articles'), article);
      article._id = docRef.id;
    }
    setArticle(article);
    return article;
  });

  if (id !== undefined) {
    return {
      article,
      setArticle,
      saveMutation: mutation,
      query,
    };
  }

  return {
    article: article as Article,
    saveMutation: mutation,
    setArticle,
  };
}

export default useArticle;
