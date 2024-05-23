'use client';

import React, { useCallback } from 'react';
import useNewArticle from '../../../../hooks/useNewArticle';
import { Form, OnSubmitArticleFormCallback } from '../form';
import { useRouter } from 'next/navigation';
import { routes } from '@couture-next/routing';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function Page() {
  const { newArticle, saveMutation } = useNewArticle();
  const router = useRouter();

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
        customizableVariants: data.customizableVariants.map((customizableVariant) => ({
          ...customizableVariant,
          threeJsModel: customizableVariant.threeJsModel.uid,
          image: customizableVariant.image.uid,
        })),
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
