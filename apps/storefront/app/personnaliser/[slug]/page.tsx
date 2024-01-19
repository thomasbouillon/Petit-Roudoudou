'use client';

import { useParams, useSearchParams } from 'next/navigation';
import useArticle from '../../../hooks/useArticle';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChooseSKU from './formSkuField';
import FormChooseFabricsFields from './formChooseFabricsFields';
import { useCart } from '../../../contexts/CartContext';
import { BreadCrumbsNav, ButtonWithLoading, WithStructuedDataWrapper } from '@couture-next/ui';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import ManufacturingTimes from '../../manufacturingTimes';
import FormChooseCustomizableFields from './formChooseCustomizableFields';
import { structuredData } from '@couture-next/seo';
import Link from 'next/link';

const schema = z.object({
  skuId: z.string().min(1),
  articleId: z.string().min(1),
  imageDataUrl: z.string().min(1),
  customizations: z.record(z.unknown()),
  quantity: z.number().int().min(1),
});

export type AddToCartFormType = z.infer<typeof schema>;

export default function Page() {
  const routeParams = useParams();
  const queryParams = useSearchParams();

  const containerRef = useRef<HTMLElement>(null);

  const [step, setStep] = useState<'chooseSKU' | 'chooseFabrics' | 'chooseOptions'>('chooseSKU');

  const { query } = useArticle({ slug: routeParams.slug as string });

  const schemaWithRefine = useMemo(
    () =>
      zodResolver(
        schema.extend({
          customizations: z.record(z.unknown()).refine(
            (customizations) => {
              return (
                // false &&
                Object.keys(customizations).length === query.data?.customizables.length &&
                Object.entries(customizations).every(([key, value]) => {
                  const customizable = query.data?.customizables.find((customizable) => customizable.uid === key);
                  if (!customizable) return false;
                  if (customizable.type === 'customizable-boolean') return typeof value === 'boolean';
                  if (customizable.type === 'customizable-part' || customizable.type === 'customizable-text')
                    return typeof value === 'string';
                  return false;
                })
              );
            },
            {
              message: 'Veuillez remplir tous les champs',
            }
          ),
        })
      ),
    [query.data?.customizables]
  );

  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { isValid, errors },
  } = useForm<AddToCartFormType>({
    resolver: schemaWithRefine,
    defaultValues: {
      quantity: 1,
      skuId: queryParams.get('sku') ?? '',
      customizations: (query.data?.customizables ?? []).reduce((acc, customizable) => {
        if (customizable.type === 'customizable-boolean') acc[customizable.uid] = false;
        if (customizable.type === 'customizable-text') acc[customizable.uid] = '';
        return acc;
      }, {} as Record<string, string | boolean>),
    },
  });

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

  const breadcrumbs = [
    {
      label: 'Boutique',
      href: '/boutique',
    },
    {
      label: article.namePlural,
      href: `/boutique/${article.slug}`,
    },
    {
      label: 'Personnalisation',
      href: `/personnaliser/${article.slug}`,
    },
  ];

  return (
    <WithStructuedDataWrapper
      as="div"
      ref={containerRef}
      className="pt-8 mb-[20vh]"
      stucturedData={structuredData.customizableArticle(query.data)}
    >
      <div className="flex items-center flex-col-reverse">
        <h1 className="font-serif text-4xl mb-4">Personnalisez votre {article.name}</h1>
        <div className="flex justify-center">
          <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadcrumbs} />
        </div>
      </div>
      <ManufacturingTimes className="text-center mb-4" />
      <Image
        src={step === 'chooseOptions' ? watch('imageDataUrl') : article.images[0].url}
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
                onNextStep={() => {
                  setStep('chooseFabrics');
                  setTimeout(() => {
                    containerRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }, 50);
                }}
              />
            </div>
          )}
          {step === 'chooseFabrics' && (
            <FormChooseFabricsFields
              className="mt-6"
              article={article}
              watch={watch}
              setValue={setValue}
              onNextStep={() => {
                setStep('chooseOptions');
                setTimeout(() => {
                  containerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 50);
              }}
            />
          )}
          {step === 'chooseOptions' && (
            <FormChooseCustomizableFields className="mt-6" article={article} register={register} errors={errors} />
          )}
          <ButtonWithLoading
            id="customize_add-to-cart-button"
            className={clsx(
              'btn-primary mx-auto mt-4',
              !isValid && 'opacity-50 cursor-not-allowed',
              step !== 'chooseOptions' && 'sr-only'
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
