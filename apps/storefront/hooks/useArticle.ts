import { trpc } from '../trpc-client';

function useArticle(id?: string) {
  const getArticleQuery = trpc.articles.findById.useQuery(id ?? '', {
    enabled: !!id,
  });

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      trpcUtils.articles.invalidate();
    },
  });

  return {
    query: getArticleQuery,
    saveMutation,
  };
}

export default useArticle;
