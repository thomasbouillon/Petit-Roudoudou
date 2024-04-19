import { trpc } from '../trpc-client';

type Props = {
  search?: string;
};

export default function useArticleGroups(props?: Props) {
  const trpcUtils = trpc.useUtils();

  const getArticleGroupsQuery = trpc.articleGroups.searchByName.useQuery(props?.search ?? '', {
    placeholderData: (oldData) => oldData ?? [],
  });
  console.log(getArticleGroupsQuery.data);

  const addGroupMutation = trpc.articleGroups.create.useMutation({
    onSuccess: () => {
      trpcUtils.articleGroups.searchByName.invalidate();
      trpcUtils.articleGroups.list.invalidate();
    },
  });

  const deleteGroupMutation = trpc.articleGroups.delete.useMutation({
    onSuccess: () => {
      trpcUtils.articleGroups.searchByName.invalidate();
      trpcUtils.articleGroups.list.invalidate();
    },
  });

  return {
    query: getArticleGroupsQuery,
    addGroupMutation,
    deleteGroupMutation,
  };
}
