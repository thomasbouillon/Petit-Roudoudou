'use client';

import React from 'react';
import { Form, OnSubmitPipingFormCallback } from '../../form';
import { useParams, useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const id = useParams().id as string;

  const query = trpc.pipings.findById.useQuery(id);
  if (query.isError) throw query.error;
  const router = useRouter();

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.pipings.update.useMutation({
    onSuccess: () => {
      trpcUtils.pipings.invalidate();
    },
  });

  const onSubmit: OnSubmitPipingFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync({
      ...data,
      id,
      image: data.image.uid,
    });
    reset(data);
    router.push(routes().admin().pipings().index());
  };

  if (query.isPending) return null;

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Modifier un passepoil</h1>
      <Form defaultValues={query.data} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
