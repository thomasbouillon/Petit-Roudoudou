import { trpc } from '../trpc-client';

function useFabric(id: string) {
  const getFabricQuery = trpc.fabrics.findById.useQuery(id);
  const trpcUtils = trpc.useUtils();

  const mutation = trpc.fabrics.update.useMutation({
    onSuccess: (data) => {
      trpcUtils.fabrics.list.invalidate();
      trpcUtils.fabrics.findById.invalidate(data.id);
    },
  });

  return {
    query: getFabricQuery,
    saveMutation: mutation,
  };
}

export default useFabric;
