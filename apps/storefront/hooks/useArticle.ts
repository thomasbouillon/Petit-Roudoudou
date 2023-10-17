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
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import slugify from 'slugify';
import { v4 as uuid } from 'uuid';

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

function useArticle(query: { slug: string }): ReturnWithQuery;
function useArticle(id: string): ReturnWithQuery;
function useArticle(): BasicReturn;
function useArticle(
  params?: string | { slug: string }
): ReturnWithQuery | BasicReturn {
  const database = useDatabase();

  const [article, setArticle] = useState<Article | null>(
    params === undefined
      ? {
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
        }
      : null
  );

  const getArticleQuery = useQuery(
    ['getArticle'],
    async () => {
      console.log(params, article);

      if (!params) throw Error('Impossible');
      let result: Article;
      if (typeof params === 'string') {
        const snapshot = await getDoc(
          doc(collection(database, 'articles'), params)
        );
        if (!snapshot.exists()) throw Error('Not found');
        result = snapshot.data() as Article;
      } else {
        const snapshot = await getDocs(
          query(
            collection(database, 'articles'),
            where('slug', '==', params.slug)
          )
        );
        if (snapshot.empty) throw Error('Not found');
        result = snapshot.docs[0].data() as Article;
      }
      setArticle(result);
      return result;
    },
    {
      enabled: !!params || !!article?._id,
    }
  );

  const mutation = useMutation(async (article: Article) => {
    article.slug = slugify(article.name, { lower: true });
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

  if (params !== undefined) {
    return {
      article,
      setArticle,
      saveMutation: mutation,
      query: getArticleQuery,
    };
  }

  return {
    article: article as Article,
    saveMutation: mutation,
    setArticle,
  };
}

export default useArticle;
