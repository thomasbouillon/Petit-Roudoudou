'use client';

import { useParams, useSearchParams } from 'next/navigation';
import useArticle from '../../../hooks/useArticle';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ChooseSKU from './formSkuField';
import FormCustomizableFields from './formCustomizableFields';
import { useCart } from '../../../contexts/CartContext';
import { ButtonWithLoading, WithStructuedDataWrapper } from '@couture-next/ui';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import { Article, StructuredDataProduct } from '@couture-next/types';

const schema = z.object({
  skuId: z.string().nonempty(),
  articleId: z.string().nonempty(),
  imageDataUrl: z.string().nonempty(),
  customizations: z.record(z.unknown()),
});

const getStructuredData = (article: Article): StructuredDataProduct => ({
  '@type': 'Product',
  name: article.name,
  description: article.description,
  image: loader({
    src: article.images[0].url,
    width: 512,
  }),
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: Math.min(...article.skus.map((sku) => sku.price)),
    highPrice: Math.max(...article.skus.map((sku) => sku.price)),
    priceCurrency: 'EUR',
  },
});

export type AddToCartFormType = z.infer<typeof schema>;

export default function Page() {
  const routeParams = useParams();
  const queryParams = useSearchParams();

  const containerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'chooseSKU' | 'chooseOptions' | 'recap'>(
    'chooseSKU'
  );

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { isValid },
  } = useForm<AddToCartFormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      skuId: queryParams.get('sku') ?? '',
      customizations: {},
    },
  });

  const { query } = useArticle({ slug: routeParams.slug as string });
  useEffect(() => {
    setValue('articleId', query.data?._id ?? '');
  }, [query.data?._id, setValue]);

  const { addToCartMutation } = useCart();

  const onSubmit = handleSubmit(async (data) => {
    await addToCartMutation.mutateAsync({
      ...data,
      type: 'add-customized-item',
    });
  });

  if (query.isError) throw query.error;
  if (query.isPending) return null;

  const article = query.data;

  return (
    <WithStructuedDataWrapper<'div'>
      as="div"
      ref={containerRef}
      className="pt-8"
      stucturedData={getStructuredData(query.data)}
    >
      <h1 className="font-serif text-4xl text-center mb-4">
        Personnaliser votre {article.name}
      </h1>
      <Image
        src={step === 'recap' ? watch('imageDataUrl') : article.images[0].url}
        alt=""
        width={256}
        height={256}
        loader={loader}
        className="w-64 h-64 object-contain mx-auto mb-6"
      />
      <div className="flex justify-center">
        <form className="max-w-3xl w-full" onSubmit={onSubmit}>
          {step === 'chooseSKU' && (
            <div className="px-4">
              <ChooseSKU
                article={article}
                value={watch('skuId')}
                setValue={setValue}
                onNextStep={() => setStep('chooseOptions')}
              />
            </div>
          )}
          {step === 'chooseOptions' && (
            <FormCustomizableFields
              className="mt-6"
              article={article}
              watch={watch}
              setValue={setValue}
              onNextStep={() => {
                setStep('recap');
                setTimeout(() => {
                  containerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 50);
              }}
            />
          )}
          <ButtonWithLoading
            className={clsx(
              'btn-primary mx-auto mt-4',
              !isValid && 'opacity-50 cursor-not-allowed',
              step !== 'recap' && 'sr-only'
            )}
            loading={addToCartMutation.isPending}
            disabled={!isValid}
            type="submit"
          >
            Ajouter au panier
          </ButtonWithLoading>
        </form>
      </div>
    </WithStructuedDataWrapper>
  );
}
