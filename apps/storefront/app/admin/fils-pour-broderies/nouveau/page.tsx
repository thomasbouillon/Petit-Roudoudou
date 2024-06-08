'use client';

import React from 'react';
import { Form, OnSubmitEmbroideryColorFormCallback } from '../form';
import { useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';
import { trpc } from 'apps/storefront/trpc-client';

export default function Page() {
  const router = useRouter();

  const newEmbroideryColor = {
    name: '',
    image: {
      url: '',
      uid: '',
    },
  };

  const saveMutation = trpc.embroideryColors.create.useMutation();

  const onSubmit: OnSubmitEmbroideryColorFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync({
      ...data,
      image: data.image.uid,
    });
    reset(data);
    router.push(routes().admin().embroideryColors().index());
  };

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouvelle couleur pour broderie</h1>
      <Form defaultValues={newEmbroideryColor} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
