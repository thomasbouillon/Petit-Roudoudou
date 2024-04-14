import { trpc } from '../trpc-client';

type Props = {
  search?: string;
};

export default function useFabricGroups(props?: Props) {
  const trpcUtils = trpc.useUtils();

  const getFabricGroupsQuery = trpc.fabricGroups.searchByName.useQuery(props?.search ?? '', {
    placeholderData: (oldData) => oldData ?? [],
  });

  const addGroupMutation = trpc.fabricGroups.create.useMutation({
    onSuccess: () => {
      trpcUtils.fabricGroups.searchByName.invalidate();
      trpcUtils.fabricGroups.list.invalidate();
    },
  });

  const deleteGroupMutation = trpc.fabricGroups.delete.useMutation({
    onSuccess: () => {
      trpcUtils.fabricGroups.searchByName.invalidate();
      trpcUtils.fabricGroups.list.invalidate();
    },
  });

  return {
    query: getFabricGroupsQuery,
    addGroupMutation,
    deleteGroupMutation,
  };
}
