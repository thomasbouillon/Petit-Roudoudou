'use client';

import React, { useCallback } from 'react';
import useArticle from '../../../../hooks/useArticle';
import { Form, OnSubmitArticleFormCallback } from '../form';
import slugify from 'slugify';

export default function Page() {
  const { article, saveMutation } = useArticle();

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      const doc = await saveMutation.mutateAsync({
        ...data,
        slug: slugify(data.name, { lower: true }),
      });
      reset(doc);
    },
    [saveMutation]
  );

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouvelle création</h1>
      <Form
        defaultValues={article ?? undefined}
        onSubmitCallback={onSubmit}
        isLoading={saveMutation.isLoading}
      />
    </>
  );
}
