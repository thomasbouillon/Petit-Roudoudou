'use client';

import React from 'react';
import useFabric from '../../../../../hooks/useFabric';
import { Form, OnSubmitFabricFormCallback } from '../../form';
import { useParams } from 'next/navigation';

export default function Page() {
  const id = useParams().id;
  const { query, saveMutation } = useFabric(id);
  if (query.error) throw query.error;

  const onSubmit: OnSubmitFabricFormCallback = async (data, reset) => {
    const doc = await saveMutation.mutateAsync(data);
    reset(doc);
  };

  if (query.isLoading) return null;

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Modifier un tissu</h1>
      <Form
        defaultValues={query.data}
        onSubmitCallback={onSubmit}
        isLoading={saveMutation.isLoading}
      />
    </>
  );
}
