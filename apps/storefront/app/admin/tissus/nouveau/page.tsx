'use client';

import React from 'react';
import useNewFabric from '../../../../hooks/useNewFabric';
import { Form, OnSubmitFabricFormCallback } from '../form';

export default function Page() {
  const { newFabric, saveMutation } = useNewFabric();

  const onSubmit: OnSubmitFabricFormCallback = async (data, reset) => {
    await saveMutation.mutateAsync(data);
    reset(data);
  };

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouveau tissu</h1>
      <Form
        defaultValues={newFabric}
        onSubmitCallback={onSubmit}
        isLoading={saveMutation.isLoading}
      />
    </>
  );
}
