import { trpc } from 'apps/storefront/trpc-client';
import { useCallback } from 'react';

type Props = {
  orderId: string;
};

export function ArchiveButton({ orderId }: Props) {
  const trpcUtils = trpc.useUtils();
  const orderQuery = trpc.orders.findById.useQuery(orderId);
  const toggleArchivedOnOrderMutation = trpc.orders.toggleArchived.useMutation({
    onSuccess: () => {
      trpcUtils.orders.invalidate();
    },
  });

  const archiveFn = useCallback(() => {
    toggleArchivedOnOrderMutation.mutate({
      orderId,
      archived: orderQuery.data?.archivedAt === null,
    });
  }, [orderId, orderQuery.data?.archivedAt, toggleArchivedOnOrderMutation]);

  if (!orderQuery.data) return null;

  if (orderQuery.data.archivedAt)
    return (
      <p className="p-2">
        Archivé le{' '}
        {new Date(orderQuery.data.archivedAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        ,{' '}
        <button onClick={archiveFn} className="text-primary-100 font-bold">
          Annuler
        </button>
      </p>
    );

  return (
    <button onClick={archiveFn} className="text-primary-100 font-bold p-2">
      Archiver
    </button>
  );
}
