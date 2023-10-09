'use client';

import React, { useCallback } from 'react';
import useArticle from '../../../../../hooks/useArticle';
import {
  default as ArticleForm,
  OnSubmitArticleFormCallback,
} from '../../form';
import { useParams } from 'next/navigation';
import { Spinner } from '@couture-next/ui';

export default function Page() {
  const id = useParams().id;

  const { query, saveMutation } = useArticle(id);
  if (query.error) throw query.error;

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      const doc = await saveMutation.mutateAsync({
        ...data,
        _id: id,
      });
      reset(doc);
    },
    [saveMutation, id]
  );

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Modifier une création</h1>
      {query.isLoading && (
        <div className="max-w-3xl h-72 bg-gray-100 relative mx-auto mt-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Spinner />
          </div>
        </div>
      )}
      {!query.isLoading && (
        <ArticleForm
          defaultValues={query.data}
          onSubmitCallback={onSubmit}
          isLoading={saveMutation.isLoading}
        />
      )}
    </>
  );
}
