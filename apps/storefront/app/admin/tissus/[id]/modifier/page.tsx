'use client';

import React from 'react';
import useFabric from '../../../../../hooks/useFabric';
import { Form, OnSubmitFabricFormCallback } from '../../form';
import { useParams, useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';

export default function Page() {
  const id = useParams().id as string;
  const { query, saveMutation } = useFabric(id);
  if (query.isError) throw query.error;
  const router = useRouter();

  const onSubmit: OnSubmitFabricFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync({
      ...data,
      id,
      image: data.image.uid,
      previewImage: data.previewImage?.uid,
    });
    reset(data);
    router.push(routes().admin().fabrics().index());
  };

  if (query.isPending) return null;

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Modifier un tissu</h1>
      <Form defaultValues={query.data} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
