'use client';

import React, { useCallback } from 'react';
import useNewArticle from '../../../../hooks/useNewArticle';
import { Form, OnSubmitArticleFormCallback } from '../form';
import slugify from 'slugify';

export default function Page() {
  const { newArticle, saveMutation } = useNewArticle();

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      await saveMutation.mutateAsync({
        ...data,
        slug: slugify(data.name, { lower: true }),
      });
      reset(data);
    },
    [saveMutation]
  );

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouvelle création</h1>
      <Form
        defaultValues={newArticle}
        onSubmitCallback={onSubmit}
        isLoading={saveMutation.isLoading}
      />
    </>
  );
}
