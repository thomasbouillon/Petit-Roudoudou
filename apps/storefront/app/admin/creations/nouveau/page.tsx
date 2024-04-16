'use client';

import React, { useCallback } from 'react';
import useNewArticle from '../../../../hooks/useNewArticle';
import { Form, OnSubmitArticleFormCallback } from '../form';
import { useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';

export default function Page() {
  const { newArticle, saveMutation } = useNewArticle();
  const router = useRouter();

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      await saveMutation.mutateAsync({
        ...data,
        threeJsModel: data.threeJsModel.uid,
        images: data.images.map((image) => image.uid),
        stocks: data.stocks.map((inStock) => ({
          ...inStock,
          images: inStock.images.map((image) => image.uid),
        })),
      });
      reset(data);
      router.push(routes().admin().products().index());
    },
    [saveMutation, router]
  );

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouvelle création</h1>
      <Form defaultValues={newArticle} onSubmitCallback={onSubmit} isPending={saveMutation.isPending} />
    </>
  );
}
