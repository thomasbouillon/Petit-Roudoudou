'use client';

import React from 'react';
import { Form, OnSubmitPipingFormCallback } from '../form';
import { useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const router = useRouter();

  const newPiping = {
    name: '',
    image: {
      url: '',
      uid: '',
    },
  };

  const saveMutation = trpc.pipings.create.useMutation();

  const onSubmit: OnSubmitPipingFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync({
      ...data,
      image: data.image.uid,
    });
    reset(data);
    router.push(routes().admin().pipings().index());
  };

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouveau tissu</h1>
      <Form defaultValues={newPiping} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
