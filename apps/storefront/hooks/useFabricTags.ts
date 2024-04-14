import { trpc } from '../trpc-client';

type Props = {
  search?: string;
};

export default function useFabricTags(props?: Props) {
  const trpcUtils = trpc.useUtils();

  const getFabricTagsQuery = trpc.fabricTags.searchByName.useQuery(props?.search ?? '', {
    placeholderData: (oldData) => oldData ?? [],
  });

  const addTagMutation = trpc.fabricTags.create.useMutation({
    onSuccess: () => {
      trpcUtils.fabricTags.list.invalidate();
      trpcUtils.fabricTags.searchByName.invalidate();
    },
  });

  const deleteTagMutation = trpc.fabricTags.delete.useMutation({
    onSuccess: () => {
      trpcUtils.fabricTags.list.invalidate();
      trpcUtils.fabricTags.searchByName.invalidate();
    },
  });

  return {
    query: getFabricTagsQuery,
    addTagMutation,
    deleteTagMutation,
  };
}
