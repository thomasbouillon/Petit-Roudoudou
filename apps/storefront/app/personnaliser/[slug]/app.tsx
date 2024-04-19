'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import ChooseSKU from './formSkuField';
import FormChooseFabricsFields from './formChooseFabricsFields';
import { useCart } from '../../../contexts/CartContext';
import { BreadCrumbsNav, ButtonWithLoading, WithStructuedDataWrapper } from '@couture-next/ui';
import { z } from 'zod';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { loader } from '../../../utils/next-image-firebase-storage-loader';
import ManufacturingTimes from '../../manufacturingTimes';
import FormChooseCustomizableFields from './formChooseCustomizableFields';
import { structuredData } from '@couture-next/seo';
import Link from 'next/link';
import { routes } from '@couture-next/routing';
import ReviewsSection from '../../boutique/[articleSlug]/[inStockSlug]/ReviewsSections';
import env from '../../../env';
import { Article } from '@couture-next/types';
import { applyTaxes } from '@couture-next/utils';
import { ArticleDetailsSection } from './articleDetailsSection';
import { trpc } from 'apps/storefront/trpc-client';

const schema = z.object({
  skuId: z.string().min(1),
  articleId: z.string().min(1),
  imageDataUrl: z.string().min(1),
  customizations: z.record(z.unknown()),
  quantity: z.number().int().min(1),
});

export type AddToCartFormType = z.infer<typeof schema>;

const allowedSteps = ['chooseFabrics', 'chooseOptions'] as const;
type Step = (typeof allowedSteps)[number];
const firstStep = allowedSteps[0];

export function App() {
  const routeParams = useParams();
  const queryParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [addedToCart, setAddedToCart] = useState(false);

  const containerRef = useRef<HTMLElement>(null);

  const step = (queryParams.get('step') ?? firstStep) as Step;

  const setStep = (next: Step) => {
    const current = new URLSearchParams(Array.from(queryParams.entries()));
    current.set('step', next);
    router.push(`${pathname}?${current.toString()}`);
  };

  const query = trpc.articles.findBySlug.useQuery(routeParams.slug as string, {
    select: (data) => data as Article,
  });

  const schemaWithRefine = useMemo(
    () =>
      zodResolver(
        schema.extend({
          customizations: z.record(z.unknown()).refine(
            (customizations) => {
              return (
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

  const form = useForm<AddToCartFormType>({
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  useEffect(() => {
    setValue('articleId', query.data?.id ?? '');
  }, [query.data?.id, setValue]);

  const allFabricsAreChosen = useMemo(() => {
    return (
      query.data?.customizables.every(
        (customizable) => customizable.type !== 'customizable-part' || !!watch('customizations')[customizable.uid]
      ) ?? true
    );
  }, [query.data, Object.values(watch('customizations'))]);

  useEffect(() => {
    // invalid step from url
    if (!allowedSteps.includes(step)) {
      setStep(firstStep);
    }

    // step manually set but state is not valid
    if (!query.isPending && step !== 'chooseFabrics' && !allFabricsAreChosen) {
      setStep('chooseFabrics');
    }
  }, [step, allFabricsAreChosen, query.isPending]);

  const { addToCartMutation } = useCart();

  const onSubmit = handleSubmit(async (data) => {
    await addToCartMutation.mutateAsync({
      ...data,
      type: 'customized',
    });
    setAddedToCart(true);
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
      stucturedData={structuredData.customizableArticle(query.data, env.CDN_BASE_URL)}
    >
      <div
        className={clsx(
          'flex items-center flex-col-reverse',
          step === 'chooseFabrics' && 'fixed top-[3.5rem] h-[3.5rem] w-full bg-white z-[11] justify-center'
        )}
      >
        {/* <h1 className="font-serif text-4xl mb-4">Personnalisez votre {article.name}</h1> */}
        <div className="flex justify-center">
          <BreadCrumbsNav Link={Link} ariaLabel="Navigation dans la boutique" items={breadcrumbs} />
        </div>
      </div>
      <div>
        <FormProvider {...form}>
          <form className={clsx('w-full h-full mx-auto', step !== 'chooseFabrics' && 'max-w-3xl')} onSubmit={onSubmit}>
            {step !== 'chooseFabrics' && (
              <>
                <Image
                  src={watch('imageDataUrl')}
                  alt=""
                  width={256}
                  height={256}
                  loader={loader}
                  className="w-64 h-64 object-contain mx-auto my-6"
                />
                <ManufacturingTimes className="text-center mb-4" />
              </>
            )}
            {step === 'chooseFabrics' && (
              <FormChooseFabricsFields
                className="mt-6 flex-grow"
                article={article}
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
              <div className="px-4">
                <h2 className="font-serif text-2xl w-full">Récapitulatif</h2>
                <ChooseSKU article={article} value={watch('skuId')} setValue={setValue} />
                <FormChooseCustomizableFields className="mt-6" article={article} register={register} errors={errors} />
                <div>
                  <TotalPrice article={article} />
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
                  {addedToCart && (
                    <Link href={routes().shop().index()} className="btn-light mx-auto">
                      Continuer mes achats
                    </Link>
                  )}
                </div>
                <div className="mt-4">
                  <ArticleDetailsSection article={article} />
                </div>
                <ReviewsSection articleId={article.id} />
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </WithStructuedDataWrapper>
  );
}

function TotalPrice({ article }: { article: Article }) {
  const watch = useFormContext<AddToCartFormType>().watch;
  const quantity = watch('quantity');
  const skuId = watch('skuId');
  const options = watch('customizations');

  const sku = skuId ? article.skus.find((sku) => sku.uid === skuId) : null;

  const optionsPrice = Object.entries(options).reduce((acc, [key, value]) => {
    const option = article.customizables.find((customizable) => customizable.uid === key);
    if (!option || !option.price) return acc;
    return acc + (value ? option.price : 0);
  }, 0);

  return (
    <div className="mt-4">
      <p className="text-center">
        <span className="font-bold">Prix total:</span>{' '}
        {sku && !isNaN(quantity) ? applyTaxes(sku.price + optionsPrice) * quantity : '-'} €
      </p>
    </div>
  );
}
