import { useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { ArticleFormType } from '../app/admin/creations/form';
import { trpc } from '../trpc-client';
import { useMutation } from '@tanstack/react-query';

function useNewArticle() {
  const newArticle = useMemo<ArticleFormType>(
    () => ({
      name: '',
      namePlural: '',
      slug: '',
      description: '',
      shortDescription: '',
      threeJsModel: {
        uid: '',
        url: '',
      },
      threeJsInitialCameraDistance: 1,
      threeJsAllAxesRotation: false,
      characteristics: {},
      customizables: [],
      seo: {
        title: '',
        description: '',
      },
      images: [],
      skus: [
        {
          uid: uuid(),
          characteristics: {},
          price: 0,
          weight: 0,
          enabled: true,
          composition: '',
        },
      ],
      stocks: [],
    }),
    []
  );

  const trpcUtils = trpc.useUtils();
  const saveMutation = trpc.articles.create.useMutation({
    onSettled: () => {
      trpcUtils.articles.invalidate();
    },
  });

  return {
    newArticle,
    saveMutation,
  };
}

export default useNewArticle;
