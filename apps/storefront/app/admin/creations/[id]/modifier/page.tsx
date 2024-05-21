'use client';

import React, { useCallback } from 'react';
import useArticle from '../../../../../hooks/useArticle';
import { ArticleFormType, Form, OnSubmitArticleFormCallback } from '../../form';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@couture-next/ui';
import { routes } from '@couture-next/routing';
import { toFormDTO } from '@couture-next/utils';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function Page() {
  const id = useParams().id as string;
  const router = useRouter();

  const { query, saveMutation } = useArticle(id);
  if (query.error) throw query.error;

  const onSubmit: OnSubmitArticleFormCallback = useCallback(
    async (data, reset) => {
      const containsSkuNotLinkedTo3dModel = data.skus.some((sku) => !sku.customizableVariantUid);
      if (containsSkuNotLinkedTo3dModel) {
        toast('Un ou plusieurs SKU ne sont pas liés à un modèle 3D', {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
          duration: 5000,
        });
      }

      const containsCustomizableVariantNotLinkedToSku = data.customizableVariants.some(
        (customizableVariant) => !data.skus.some((sku) => sku.customizableVariantUid === customizableVariant.uid)
      );
      if (containsCustomizableVariantNotLinkedToSku) {
        toast('Un ou plusieurs modèle(s) 3D ne sont pas liés à un SKU', {
          icon: <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />,
          duration: 5000,
        });
      }

      await saveMutation.mutateAsync({
        ...data,
        id,
        customizableVariants: data.customizableVariants.map((customizableVariant) => ({
          ...customizableVariant,
          threeJsModel: customizableVariant.threeJsModel.uid,
          image: customizableVariant.image.uid,
        })),
        images: data.images.map((image) => image.uid),
        stocks: data.stocks.map((stock) => ({
          ...stock,
          images: stock.images.map((image) => image.uid),
        })),
      });
      reset(data);
      router.push(routes().admin().products().index());
    },
    [saveMutation, id, router]
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
      <p className="text-center mt-2">Identifiant de l'article: {id}</p>
      {!query.isPending && (
        <Form
          defaultValues={(toFormDTO(query.data!) as ArticleFormType) ?? undefined}
          onSubmitCallback={onSubmit}
          isPending={saveMutation.isPending}
        />
      )}
    </>
  );
}
