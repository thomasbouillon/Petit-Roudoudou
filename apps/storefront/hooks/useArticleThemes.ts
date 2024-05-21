import { trpc } from '../trpc-client';

type Props = {
  search?: string;
};

export default function useArticleThemes(props?: Props) {
  const trpcUtils = trpc.useUtils();

  const getArticleThemesQuery = trpc.articleThemes.searchByName.useQuery(props?.search ?? '', {
    placeholderData: (oldData) => oldData ?? [],
  });

  const addThemeMutation = trpc.articleThemes.create.useMutation({
    onSuccess: () => {
      trpcUtils.articleThemes.searchByName.invalidate();
      trpcUtils.articleThemes.list.invalidate();
    },
  });

  const deleteThemeMutation = trpc.articleThemes.delete.useMutation({
    onSuccess: () => {
      trpcUtils.articleThemes.searchByName.invalidate();
      trpcUtils.articleThemes.list.invalidate();
    },
  });

  return {
    query: getArticleThemesQuery,
    addThemeMutation,
    deleteThemeMutation,
  };
}
