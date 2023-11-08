'use client';

import React, { useCallback } from 'react';
import useNewArticle from '../../../../hooks/useNewArticle';
import { Form, OnSubmitArticleFormCallback } from '../form';
import slugify from 'slugify';
import { useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';

export default function Page() {
  const { newArticle, saveMutation } = useNewArticle();
  const router = useRouter();

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      await saveMutation.mutateAsync({
        ...data,
        slug: slugify(data.name, { lower: true }),
      });
      reset(data);
      router.push(routes().admin().products().index());
    },
    [saveMutation, router]
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
