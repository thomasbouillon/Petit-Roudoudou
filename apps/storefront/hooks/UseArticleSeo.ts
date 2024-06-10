import { trpc } from '../trpc-client';

function useArticleSeo(id?: string) {
const getArticleSeoQuery = trpc.articlesSeo.findById.useQuery(id ?? '', {
    enabled: !!id,
    select: (data) => ({
      seo: data.seo,
      stocks: data.stocks,
    }),
  });

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.articlesSeo.update.useMutation({
    
    onSuccess: () => {
      trpcUtils.articlesSeo.invalidate();
    },
    
  });
  

  return {
    query: getArticleSeoQuery,
    saveMutation,

  };
}

export default useArticleSeo;
