import { useMemo } from 'react';
import { trpc } from '../trpc-client';

function useNewFabric() {
  const newFabric = useMemo(
    () => ({
      name: '',
      image: { url: '', uid: '', placeholderDataUrl: null },
      previewImage: null,
      groupIds: [],
      size: [0, 0] as [number, number],
      tagIds: [],
    }),
    []
  );

  const trpcUtils = trpc.useUtils();

  const saveMutation = trpc.fabrics.create.useMutation({
    onSuccess: () => {
      trpcUtils.fabrics.list.invalidate();
    },
  });

  return {
    newFabric,
    saveMutation,
  };
}

export default useNewFabric;
