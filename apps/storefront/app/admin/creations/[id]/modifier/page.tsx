'use client';

import React, { useCallback } from 'react';
import useArticle from '../../../../../hooks/useArticle';
import { Form, OnSubmitArticleFormCallback } from '../../form';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { createSlugFromTitle } from '../../utils';

export default function Page() {
  const id = useParams().id as string;
  const router = useRouter();

  const { query, saveMutation } = useArticle(id);
  if (query.error) throw query.error;

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      if (!query.data) throw Error('No data');
      await saveMutation.mutateAsync({
        ...data,
        _id: id,
        slug: createSlugFromTitle(data.namePlural),
        stocks: data.stocks.map((inStock) => ({
          ...inStock,
          slug: createSlugFromTitle(inStock.title),
        })),
      });
      reset(data);
      router.push(routes().admin().products().index());
    },
    [saveMutation, id, router]
  );

  const getUid = useCallback(
    (stockIndex?: string) => {
      if (!query.data) throw Error('No data');
      return `${query.data._id}${stockIndex ? `#${stockIndex}` : ''}`;
    },
    [query.data]
  );

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Modifier une création</h1>
      {query.isPending && (
        <div className="max-w-3xl h-72 bg-gray-100 relative mx-auto mt-8">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Spinner />
          </div>
        </div>
      )}
      {!query.isPending && (
        <Form
          defaultValues={query.data}
          onSubmitCallback={onSubmit}
          isPending={saveMutation.isPending}
          getUid={getUid}
        />
      )}
    </>
  );
}
