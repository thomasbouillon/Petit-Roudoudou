import type { Article } from '@couture-next/types';
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
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
  saveMutation: UseMutationResult<string, unknown, Article, unknown>;
};

function useArticle(query: { slug: string }): Return;
function useArticle(id: string): Return;
function useArticle(params: string | { slug: string }): Return {
  const database = useDatabase();
  const queryClient = useQueryClient();

  const queryKey =
    typeof params === 'string'
      ? ['articles.find', params]
      : ['articles.find.slug', params.slug];
  const getArticleQuery = useQuery({
    queryKey,
    queryFn: async () => {
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
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (article) => {
      const toSet = { ...article, _id: undefined };
      delete toSet._id;
      await setDoc(doc(collection(database, 'articles'), article._id), toSet);
      return article._id;
    },
    onSuccess: (savedId) => {
      queryClient.invalidateQueries({ queryKey: ['articles.all'] });
      queryClient.invalidateQueries({ queryKey: ['articles.find', savedId] });
      if (getArticleQuery.data)
        queryClient.invalidateQueries({
          queryKey: ['articles.find.slug', getArticleQuery.data.slug],
        });
    },
  }) satisfies Return['saveMutation'];

  return {
    query: getArticleQuery,
    saveMutation,
  };
}

export default useArticle;
