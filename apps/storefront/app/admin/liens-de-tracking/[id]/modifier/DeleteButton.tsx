'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
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
      <PopoverButton className="btn-secondary text-red-500 border-red-500 mx-auto mt-4">Supprimer</PopoverButton>
      <PopoverPanel
        anchor={{
          to: 'bottom',
          gap: '1rem',
        }}
      >
        <button className="btn-primary text-white bg-red-500 mx-auto" onClick={deleteFn}>
          Confirmer
        </button>
      </PopoverPanel>
    </Popover>
  );
}
