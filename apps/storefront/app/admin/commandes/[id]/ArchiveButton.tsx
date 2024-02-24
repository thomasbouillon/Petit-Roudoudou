import { Order } from '@couture-next/types';
import { DocumentReference, setDoc } from '@firebase/firestore';
import { useMutation } from '@tanstack/react-query';
import { useFirestoreDocumentQuery } from 'apps/storefront/hooks/useFirestoreDocumentQuery';
import { useCallback } from 'react';

type Props = {
  orderRef: DocumentReference<Order>;
};

export function ArchiveButton({ orderRef }: Props) {
  const orderQuery = useFirestoreDocumentQuery(orderRef);

  const mutateFn = useCallback(async () => {
    await setDoc(
      orderRef,
      {
        archivedAt: orderQuery.data?.archivedAt ? null : new Date(),
      },
      {
        merge: true,
      }
    );
  }, [orderQuery.data?.archivedAt]);

  const toggleArchivedOnOrderMutation = useMutation({
    mutationFn: mutateFn,
  });

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
        <button
          onClick={() => {
            toggleArchivedOnOrderMutation.mutate();
          }}
          className="text-primary-100 font-bold"
        >
          Annuler
        </button>
      </p>
    );

  return (
    <button
      onClick={() => {
        toggleArchivedOnOrderMutation.mutate();
      }}
      className="text-primary-100 font-bold p-2"
    >
      Archiver
    </button>
  );
}
