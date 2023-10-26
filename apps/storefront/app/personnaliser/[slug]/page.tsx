'use client';

import { useParams, useSearchParams } from 'next/navigation';
import useArticle from '../../../hooks/useArticle';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ChooseSKU from './formSkuField';
import FormCustomizableFields from './formCustomizableFields';
import { useCart } from '../../../contexts/CartContext';
import { ButtonWithLoading } from '@couture-next/ui';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

const schema = z.object({
  skuId: z.string().nonempty(),
  articleId: z.string().nonempty(),
  imageDataUrl: z.string().nonempty(),
  customizations: z.record(z.unknown()),
});

export type AddToCartFormType = z.infer<typeof schema>;

export default function Page() {
  const routeParams = useParams();
  const queryParams = useSearchParams();

  const [step, setStep] = useState<'chooseSKU' | 'chooseOptions' | 'recap'>(
    'chooseSKU'
  );

  const {
    setValue,
    getValues,
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

  const { query } = useArticle({ slug: routeParams.slug });
  useEffect(() => {
    setValue('articleId', query.data?._id ?? '');
  }, [query.data?._id, setValue]);

  const { addToCartMutation } = useCart();

  const onSubmit = handleSubmit(async (data) => {
    await addToCartMutation.mutateAsync(data);
  });

  if (query.isError) throw query.error;
  if (query.isLoading) return null;

  const article = query.data;

  return (
    <div>
      <h1 className="font-serif text-4xl text-center mb-4 mt-8">
        Personnaliser sa couverture
      </h1>
      <Image
        src={step === 'recap' ? watch('imageDataUrl') : article.images[0].url}
        alt=""
        width={256}
        height={256}
        className="w-64 h-64 object-contain mx-auto mb-6"
      />
      <div className="flex justify-center">
        <form className="max-w-3xl w-full" onSubmit={onSubmit}>
          {step === 'chooseSKU' && (
            <ChooseSKU
              article={article}
              value={getValues('skuId')}
              setValue={setValue}
              onNextStep={() => setStep('chooseOptions')}
            />
          )}
          {step === 'chooseOptions' && (
            <FormCustomizableFields
              className="mt-6"
              article={article}
              watch={watch}
              setValue={setValue}
              onNextStep={() => setStep('recap')}
            />
          )}
          <ButtonWithLoading
            className={clsx(
              'btn-primary mx-auto mt-4',
              !isValid && 'opacity-50 cursor-not-allowed',
              step !== 'recap' && 'sr-only'
            )}
            loading={addToCartMutation.isLoading}
            disabled={!isValid}
            type="submit"
          >
            Ajouter au panier
          </ButtonWithLoading>
        </form>
      </div>
    </div>
  );
}
