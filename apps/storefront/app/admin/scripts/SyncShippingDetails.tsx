'use client';

import { ButtonWithLoading } from '@couture-next/ui';
import { trpc } from 'apps/storefront/trpc-client';
import { useState } from 'react';

export default function SyncShippingDetails() {
  const syncShippingDetailsMutation = trpc.articles.syncShippingDetails.useMutation();

  return (
    <div className="flex gap-4 items-center">
      <ButtonWithLoading
        loading={syncShippingDetailsMutation.isPending}
        type="button"
        className="btn-primary"
        onClick={() => syncShippingDetailsMutation.mutateAsync()}
      >
        Sync
      </ButtonWithLoading>
    </div>
  );
}
