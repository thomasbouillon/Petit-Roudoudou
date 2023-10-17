'use client';

import React from 'react';
import useFabric from '../../../../hooks/useFabric';
import { Form, OnSubmitFabricFormCallback } from '../form';

export default function Page() {
  const { fabric, saveMutation } = useFabric();

  const onSubmit: OnSubmitFabricFormCallback = async (data, reset) => {
    const doc = await saveMutation.mutateAsync(data);
    reset(doc);
  };

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouveau tissu</h1>
      <Form
        defaultValues={fabric}
        onSubmitCallback={onSubmit}
        isLoading={saveMutation.isLoading}
      />
    </>
  );
}
