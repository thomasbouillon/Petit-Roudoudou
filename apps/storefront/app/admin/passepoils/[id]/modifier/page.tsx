'use client';

import React from 'react';
import { Form, OnSubmitPipingFormCallback } from '../../form';
import { useParams, useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';

export default function Page() {
  const id = useParams().id as string;

  const router = useRouter();
  const query = trpc.pipings.findById.useQuery(id);
  if (query.isError) {
    router.push(routes().admin().pipings().index());
    return null;
  }

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.pipings.update.useMutation({
    onSuccess: () => {
      trpcUtils.pipings.invalidate();
    },
  });
  const deleteMutation = trpc.pipings.delete.useMutation();
  const deletePiping = async () => {
    await deleteMutation.mutateAsync({ id });
    router.push(routes().admin().pipings().index());
    trpcUtils.pipings.invalidate();
  };

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
      <ButtonWithLoading
        loading={deleteMutation.isPending}
        className="block mt-6 border-current border px-4 py-2 text-red-500 mx-auto"
        onClick={deletePiping}
      >
        Supprimer
      </ButtonWithLoading>
      <Form defaultValues={query.data} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
