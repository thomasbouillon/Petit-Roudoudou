import type { Article } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import useDatabase from './useDatabase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestoreConverterAddRemoveId } from '@couture-next/utils';

type Return = {
  query: UseQueryResult<Article>;
  saveMutation: UseMutationResult<void, unknown, Article, unknown>;
};

function useArticle(query: { slug: string }): Return;
function useArticle(id: string): Return;
function useArticle(params: string | { slug: string }): Return {
  const database = useDatabase();

  const queryKey =
    typeof params === 'string'
      ? ['articles.find', params]
      : ['articles.find.slug', params.slug];
  const getArticleQuery = useQuery(queryKey, async () => {
    let result: Article;
    if (typeof params === 'string') {
      const snapshot = await getDoc(
        doc(collection(database, 'articles'), params).withConverter(
          firestoreConverterAddRemoveId<Article>()
        )
      );
      if (!snapshot.exists()) throw Error('Not found');
      result = snapshot.data();
    } else {
      const snapshot = await getDocs(
        query(
          collection(database, 'articles'),
          where('slug', '==', params.slug)
        ).withConverter(firestoreConverterAddRemoveId<Article>())
      );
      if (snapshot.empty) throw Error('Not found');
      result = snapshot.docs[0].data();
    }
    return result;
  });

  const saveMutation = useMutation(async (article) => {
    const toSet = { ...article, _id: undefined };
    delete toSet._id;
    await setDoc(doc(collection(database, 'articles'), article._id), toSet);
  }) satisfies Return['saveMutation'];

  return {
    query: getArticleQuery,
    saveMutation,
  };
}

export default useArticle;
