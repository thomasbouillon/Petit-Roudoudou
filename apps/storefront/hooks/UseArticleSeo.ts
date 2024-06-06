import { trpc } from '../trpc-client';

function useArticleSeo(id?: string) {
const getArticleSeoQuery = trpc.articles.findById.useQuery(id ?? '', {
    enabled: !!id,
    select: (data) => ({
      seo: data.seo,
      stocks: data.stocks,
    }),
  });

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.articles.update.useMutation({
    
    onSuccess: () => {
      trpcUtils.articles.invalidate();
    },
    
  });

  return {
    query: getArticleSeoQuery,
    saveMutation,

  };
}

export default useArticleSeo;
