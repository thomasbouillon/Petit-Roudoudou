'use client';

import env from 'apps/storefront/env';
import Form, { TrackingLinkForm } from '../../(form)/Form';
import { trpc } from 'apps/storefront/trpc-client';
import { useCallback } from 'react';
import { TrackingLink } from '@prisma/client';

type Props = {
  trackingLinkId: string;
};

export default function EditTrackingLinkForm({ trackingLinkId }: Props) {
  const trpcUtils = trpc.useUtils();
  const createMutation = trpc.trackingLinks.update.useMutation({
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
      id: trackingLinkId,
      name: data.name,
      url: url.toString(),
    });
  }, []);

  const trackingLinkQuery = trpc.trackingLinks.findById.useQuery(trackingLinkId);
  if (trackingLinkQuery.isError) throw trackingLinkQuery.error;
  if (!trackingLinkQuery.data) return null;

  const url = new URL(trackingLinkQuery.data.url);
  const utm = {
    source: url.searchParams.get('utm_source') || '',
    medium: url.searchParams.get('utm_medium') || '',
    campaign: url.searchParams.get('utm_campaign') || '',
    content: url.searchParams.get('utm_content') || '',
  };
  const pathname = url.pathname;

  return (
    <Form
      defaultValues={{
        name: trackingLinkQuery.data.name,
        pathname,
        utm,
        qrCodeSize: 256,
      }}
      onSubmitCallback={onSubmitCallback}
    />
  );
}
