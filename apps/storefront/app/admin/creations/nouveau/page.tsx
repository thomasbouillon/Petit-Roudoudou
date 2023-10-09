'use client';

import React from 'react';
import useArticle from '../../../../hooks/useArticle';
import useDatabase from '../../../../hooks/useDatabase';
import { useMutation } from '@tanstack/react-query';
import { addDoc, collection } from 'firebase/firestore';
import { Article } from '@couture-next/types';
import {
  ArticleFormType,
  default as ArticleForm,
  OnSubmitArticleFormCallback,
} from '../form';

export default function Page() {
  const { article } = useArticle();

  const database = useDatabase();
  const createArticleMutation = useMutation(async (data: ArticleFormType) => {
    const docRef = await addDoc(collection(database, 'articles'), data);
    return {
      ...data,
      id: docRef.id,
    };
  });

  const onSubmit: OnSubmitArticleFormCallback = async (data, reset) => {
    const doc = await createArticleMutation.mutateAsync(data);
    reset(doc);
  };

  return (
    <>
      <h1 className="text-5xl font-serif text-center">Nouvelle création</h1>
      <ArticleForm
        defaultValues={article ?? undefined}
        onSubmitCallback={onSubmit}
        isLoading={createArticleMutation.isLoading}
      />
    </>
  );
}
