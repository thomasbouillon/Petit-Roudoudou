'use client';

import env from 'apps/storefront/env';
import Form, { TrackingLinkForm } from '../(form)/Form';
import { trpc } from 'apps/storefront/trpc-client';
import { useCallback } from 'react';

export default function CreateTrackingLinkForm() {
  const trpcUtils = trpc.useUtils();
  const createMutation = trpc.trackingLinks.create.useMutation({
    async onSuccess() {
      await trpcUtils.trackingLinks.invalidate();
    },
  });

  const onSubmitCallback = useCallback(async (data: TrackingLinkForm) => {
    const url = new URL(data.pathname, env.BASE_URL);
    url.searchParams.append('utm_source', data.utm.source);
    url.searchParams.append('utm_medium', data.utm.medium);
    url.searchParams.append('utm_campaign', data.utm.campaign);
    url.searchParams.append('utm_content', data.utm.content);
    await createMutation.mutateAsync({
      name: data.name,
      url: url.toString(),
    });
  }, []);

  return (
    <Form
      defaultValues={{
        name: '',
        pathname: '',
        utm: {
          source: '',
          medium: '',
          campaign: '',
          content: '',
        },
        qrCodeSize: 256,
      }}
      onSubmitCallback={onSubmitCallback}
    />
  );
}
