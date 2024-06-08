'use client';

import { Popover } from '@headlessui/react';
import { trpc } from 'apps/storefront/trpc-client';
import { useCallback } from 'react';
import { routes } from '@couture-next/routing';
import { useRouter } from 'next/navigation';

type Props = { trackingLinkId: string };
export default function DeleteButton({ trackingLinkId }: Props) {
  const trpcUtils = trpc.useUtils();
  const deleteMutation = trpc.trackingLinks.delete.useMutation({
    async onSuccess() {
      await trpcUtils.trackingLinks.invalidate();
    },
  });
  const router = useRouter();
  const deleteFn = useCallback(async () => {
    await deleteMutation.mutateAsync(trackingLinkId);
    router.push(routes().admin().trackingLinks().index());
  }, [trackingLinkId]);

  return (
    <Popover className="">
      <Popover.Button className="btn-secondary text-red-500 border-red-500 mx-auto mt-4">Supprimer</Popover.Button>
      <Popover.Panel className="">
        <button className="btn-primary text-white bg-red-500 mx-auto" onClick={deleteFn}>
          Confirmer
        </button>
      </Popover.Panel>
    </Popover>
  );
}
