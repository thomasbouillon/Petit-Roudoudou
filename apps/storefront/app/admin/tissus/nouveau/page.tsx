'use client';

import React from 'react';
import useNewFabric from '../../../../hooks/useNewFabric';
import { Form, OnSubmitFabricFormCallback } from '../form';
import { useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';

export default function Page() {
  const { newFabric, saveMutation } = useNewFabric();
  const router = useRouter();

  const onSubmit: OnSubmitFabricFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync({
      ...data,
      image: data.image.uid,
      previewImage: data.previewImage?.uid,
    });
    reset(data);
    router.push(routes().admin().fabrics().index());
  };

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouveau tissu</h1>
      <Form defaultValues={newFabric} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
